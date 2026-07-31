import json
import logging
import time
from typing import Any, Type, TypeVar
from pydantic import BaseModel, ValidationError

from django.conf import settings

from .errors import ErrorType, PipelineError, Stage, ValidationResult
from .normalization import NormalizationService
from .aliases import AliasMapper
from .recovery import attempt_recovery, _extract_json_object, _strip_markdown_fences

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class ValidationPipeline:
    """
    Centralized pipeline for processing raw LLM outputs.
    
    1. Parse JSON -> Local Normalization -> Alias Mapping -> Pydantic Validation.
    2. If validation fails, performs ONE self-correction LLM call.
    3. If still fails, falls back to local JSON repair heuristics.
    4. Records metrics.
    """

    @classmethod
    def run(
        cls,
        llm_service: Any,
        schema_cls: Type[T],
        prompt: str,
        raw_response: str,
        agent_name: str = "UnknownAgent",
        request_id: str = "",
        model: str = "",
        temperature: float = 0.0,
    ) -> ValidationResult[T]:
        
        ctx = f"[request_id={request_id}]"
        start_time = time.time()
        
        logger.info(
            "%s ValidationPipeline started | agent=%s model=%s temp=%.2f length=%d",
            ctx, agent_name, model, temperature, len(raw_response)
        )
        
        # --- First Pass ---
        result, first_pass_errors, is_schema = cls._attempt_validation(schema_cls, raw_response, ctx)
        if result.success:
            cls._log_metrics(ctx, agent_name, start_time, True, False, 0)
            return result
            
        enable_self_correction = getattr(settings, "AI_ENABLE_SELF_CORRECTION", True)
        
        # --- Self-Correction (1 Pass max) ---
        if enable_self_correction and (first_pass_errors or is_schema):
            logger.warning("%s First pass failed (is_schema=%s), attempting LLM self-correction", ctx, is_schema)
            
            if is_schema:
                correction_prompt = (
                    "You returned the JSON Schema definition instead of a JSON object instance.\n"
                    "Remove `$defs`, `properties`, `required`, `title`, and `type`.\n"
                    "Return ONLY a valid JSON object matching the schema, with real values.\n"
                    "Do not reproduce the schema itself.\n"
                )
            else:
                error_details = json.dumps([{"field": str(e.get("loc", "")), "msg": e.get("msg", "")} for e in first_pass_errors], indent=2)
                correction_prompt = (
                    "The previous JSON failed validation.\n\n"
                    f"Original Response:\n{raw_response}\n\n"
                    f"Validation Errors:\n{error_details}\n\n"
                    "Return ONLY valid JSON. Preserve all valid fields. Modify only the invalid or missing fields.\n"
                    "Do not explain anything. Do not use markdown.\n"
                )
            
            try:
                # LLM call for correction
                corrected_response = llm_service.generate(
                    input=raw_response, # Providing it as input again helps context window
                    instructions=correction_prompt,
                    model=model,
                    temperature=0.0, # Self-correction must be deterministic
                    request_id=request_id,
                )
                
                corrected_result, _, _ = cls._attempt_validation(schema_cls, corrected_response, ctx, is_correction=True)
                if corrected_result.success:
                    cls._log_metrics(ctx, agent_name, start_time, True, True, 1)
                    return corrected_result
                    
            except Exception as exc:
                logger.error("%s Self-correction call failed: %s", ctx, exc)

        # --- Local Fallback Repair ---
        logger.warning("%s Falling back to local JSON repair (attempt_recovery)", ctx)
        repair_result = attempt_recovery(raw_response, schema_cls, request_id)
        if repair_result.success:
             cls._log_metrics(ctx, agent_name, start_time, True, True, 0, repaired=True)
             return repair_result
             
        cls._log_metrics(ctx, agent_name, start_time, False, enable_self_correction, 0)
        return repair_result
        
    @classmethod
    def _attempt_validation(cls, schema_cls: Type[T], raw_text: str, ctx: str, is_correction: bool = False) -> tuple[ValidationResult[T], list[dict], bool]:
        """
        Extracts JSON, normalizes, applies aliases, and validates via Pydantic.
        Returns (ValidationResult, list_of_pydantic_errors).
        """
        # Strip markdown fences if present
        clean_text = _strip_markdown_fences(raw_text)
        clean_text = _extract_json_object(clean_text)
        if not clean_text.strip():
            clean_text = raw_text
            
        try:
            parsed_data = json.loads(clean_text)
        except json.JSONDecodeError as exc:
            msg = f"JSON parsing failed: {exc}"
            logger.warning("%s %s", ctx, msg)
            return ValidationResult.fail(PipelineError(error_type=ErrorType.VALIDATION_ERROR, message=msg, raw_output=raw_text)), [], False
            
        # 0. Early detection for Returned Schema instead of Instance
        is_schema = False
        if isinstance(parsed_data, dict):
            schema_keys = {"$defs", "properties", "required", "type", "title"}
            if len(schema_keys.intersection(parsed_data.keys())) >= 2:
                is_schema = True
                msg = "LLM returned JSON Schema instead of an instance."
                logger.warning("%s %s", ctx, msg)
                return ValidationResult.fail(
                    PipelineError(
                        error_type=ErrorType.VALIDATION_ERROR,
                        stage=Stage.LLM_VALIDATION,
                        message=msg,
                        raw_output=raw_text,
                    )
                ), [{"msg": msg}], is_schema

        # 1. Normalize
        normalized_data = NormalizationService.normalize(parsed_data)
        
        # 2. Alias mapping
        aliased_data = AliasMapper.apply_aliases(normalized_data)
        
        # 3. Pydantic Validation
        try:
            validated_obj = schema_cls.model_validate(aliased_data)
            return ValidationResult.ok(validated_obj), [], False
        except ValidationError as exc:
            errors = exc.errors()
            logger.warning("%s Validation Error (%d errors) | is_correction=%s", ctx, len(errors), is_correction)
            for e in errors:
                logger.warning(
                    "%s Validation Error: Field='%s' | ExpectedType='%s' | ReceivedValue='%s' | Message='%s'", 
                    ctx, str(e.get("loc")), e.get("type"), str(e.get("input")), e.get("msg")
                )
            
            return ValidationResult.fail(
                PipelineError(
                    error_type=ErrorType.VALIDATION_ERROR,
                    stage=Stage.LLM_VALIDATION,
                    message="Schema validation failed",
                    raw_output=raw_text,
                    details={"pydantic_errors": errors}
                )
            ), errors, False
            
    @classmethod
    def _log_metrics(cls, ctx: str, agent_name: str, start_time: float, success: bool, correction_used: bool, extra_calls: int, repaired: bool = False):
        elapsed = time.time() - start_time
        logger.info(
            "%s Pipeline Metrics | agent=%s success=%s correction_used=%s repaired=%s extra_calls=%d elapsed=%.2fs",
            ctx, agent_name, success, correction_used, repaired, extra_calls, elapsed
        )
