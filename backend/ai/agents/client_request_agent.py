"""
ai/agents/client_request_agent.py
==================================
Orchestrates the full project specification extraction pipeline.

Pipeline steps
--------------
1. Sanitize input (truncation, whitespace normalization, control chars).
2. Call LLM → raw text output.
3. Attempt direct Pydantic validation.
4. On failure → run local JSON repair (Stage 1 then Stage 2).
5. Return ExtractionResult — ALWAYS. Never raises to the caller.

Structured logging is emitted at every stage with a correlation
request_id so failures can be traced end-to-end.
"""
from __future__ import annotations

import logging
import uuid

from pydantic import ValidationError

from django.conf import settings

from ..prompts.proj_spec_prompt import EXTRACTION_PROMPT
from ..schemas.proj_spec_schema import ProjectSpecification
from ..services.errors import ErrorType, ExtractionResult, PipelineError, Stage
from ..services.llm import get_llm_service
from ..services.recovery import attempt_recovery
from ..services.sanitization import sanitize_input

logger = logging.getLogger(__name__)


class ClientRequestAgent:
    """
    End-to-end orchestrator for the LLM-based project spec extraction.

    Every call to extract() is guaranteed to return an ExtractionResult.
    It will never propagate an unhandled exception to callers.
    """

    prompt = EXTRACTION_PROMPT

    def __init__(self) -> None:
        self.llm = get_llm_service()

    def extract(self, client_message: str, request_id: str = "") -> ExtractionResult:
        """
        Extract a structured ProjectSpecification from a raw client message.

        Parameters
        ----------
        client_message  : Raw text from InputProcessor.
        request_id      : Correlation ID; one is generated if not provided.

        Returns
        -------
        ExtractionResult — either .success=True with .data, or .success=False
        with a fully populated .error PipelineError.
        """
        if not request_id:
            request_id = uuid.uuid4().hex[:12]

        ctx = f"[request_id={request_id}]"

        # ── Step 1: Sanitize input ────────────────────────────────────────────
        try:
            sanitized = sanitize_input(client_message, request_id=request_id)
        except ValueError as exc:
            logger.warning("%s Sanitization rejected input: %s", ctx, exc)
            return ExtractionResult.fail(
                PipelineError(
                    error_type=ErrorType.INPUT_ERROR,
                    stage=Stage.SANITIZATION,
                    message=str(exc),
                    recovery_attempted=False,
                )
            )
        except Exception as exc:
            logger.exception("%s Unexpected error during sanitization", ctx)
            return ExtractionResult.fail(
                PipelineError(
                    error_type=ErrorType.UNKNOWN,
                    stage=Stage.SANITIZATION,
                    message="Unexpected error during input preparation.",
                    recovery_attempted=False,
                )
            )

        logger.info(
            "%s Extraction starting | input_chars=%d",
            ctx,
            len(sanitized),
        )

        # ── Step 2: Call LLM ──────────────────────────────────────────────────
        try:
            raw = self.llm.generate(
                input=sanitized,
                instructions=self.prompt,
                temperature=settings.AI_MODELS["extraction"]["temperature"],
                model=settings.AI_MODELS["extraction"]["model"],
                request_id=request_id,
            )
        except ValueError as exc:
            # Empty / missing output_text from the API
            logger.error("%s LLM returned empty response: %s", ctx, exc)
            return ExtractionResult.fail(
                PipelineError(
                    error_type=ErrorType.LLM_ERROR,
                    stage=Stage.LLM_CALL,
                    message="The AI service returned an empty response. Please try again.",
                    recovery_attempted=False,
                )
            )
        except Exception as exc:
            # Covers tenacity.RetryError (all retries exhausted) and non-retried
            # OpenAI errors (auth, bad request, etc.)
            logger.error("%s LLM call failed: %s: %s", ctx, type(exc).__name__, exc)
            return ExtractionResult.fail(
                PipelineError(
                    error_type=ErrorType.LLM_ERROR,
                    stage=Stage.LLM_CALL,
                    message="AI extraction service is temporarily unavailable. Please try again.",
                    recovery_attempted=False,
                )
            )

        logger.info("%s LLM response received | output_chars=%d", ctx, len(raw))

        # ── Step 3: Centralized Validation Pipeline ───────────────────────────
        from ..services.pipeline import ValidationPipeline

        result = ValidationPipeline.run(
            llm_service=self.llm,
            schema_cls=ProjectSpecification,
            prompt=self.prompt,
            raw_response=raw,
            agent_name="ClientRequestAgent",
            request_id=request_id,
            model=settings.AI_MODELS["extraction"]["model"],
            temperature=settings.AI_MODELS["extraction"]["temperature"]
        )

        if result.success:
            spec = result.data
            logger.info(
                "%s Extraction complete | project_type=%s urgency=%s confidence=%s",
                ctx,
                spec.project_type,
                spec.urgency,
                spec.metadata.confidence_score if spec.metadata else "n/a",
            )
        else:
            logger.warning("%s Extraction failed — returning structured failure", ctx)

        return result