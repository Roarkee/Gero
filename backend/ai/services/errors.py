"""
ai/services/errors.py
=====================
Structured error types and the ExtractionResult envelope.

Every pipeline call returns an ExtractionResult — either a valid
ProjectSpecification or a PipelineError. No raw exceptions ever
propagate to callers beyond the agent layer.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from ai.schemas.proj_spec_schema import ProjectSpecification


# ─── Error type constants ────────────────────────────────────────────────────

class ErrorType:
    INPUT_ERROR = "input_error"
    LLM_ERROR = "llm_error"
    VALIDATION_ERROR = "validation_error"
    RECOVERY_EXHAUSTED = "recovery_exhausted"
    UNKNOWN = "unknown_error"
    UNKNOWN_ERROR = "unknown_error"


class Stage:
    INPUT_PROCESSING = "input_processing"
    SANITIZATION = "sanitization"
    LLM_CALL = "llm_call"
    LLM_VALIDATION = "llm_validation"
    JSON_REPAIR_STAGE1 = "json_repair_stage1"
    JSON_REPAIR_STAGE2 = "json_repair_stage2"


# ─── PipelineError ───────────────────────────────────────────────────────────

@dataclass
class PipelineError:
    """
    Standardised error envelope for every failure mode in the extraction pipeline.

    Fields
    ------
    status              Always "failed".
    error_type          Broad category — see ErrorType constants.
    stage               Which layer of the pipeline produced the error.
    message             Human-readable description safe to surface to the user.
    raw_output          The raw LLM text that triggered the failure (may be None
                        for input-layer errors).
    recovery_attempted  True if the JSON repair pipeline ran.
    retry_count         Number of LLM retry attempts made by tenacity.
    details             Arbitrary extra data (e.g. Pydantic error list).
    """

    status: str = "failed"
    error_type: str = ErrorType.UNKNOWN
    stage: str = Stage.LLM_CALL
    message: str = ""
    raw_output: str | None = None
    recovery_attempted: bool = False
    retry_count: int = 0
    details: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialisable representation for storage in AIRequest.error_details."""
        return {
            "status": self.status,
            "error_type": self.error_type,
            "stage": self.stage,
            "message": self.message,
            "raw_output": self.raw_output,
            "recovery_attempted": self.recovery_attempted,
            "retry_count": self.retry_count,
            "details": self.details,
        }

    def to_response_dict(self) -> dict[str, Any]:
        """
        Sanitised representation safe to return in API responses.
        Does NOT include raw_output (could contain user data).
        """
        out: dict[str, Any] = {
            "status": self.status,
            "error_type": self.error_type,
            "stage": self.stage,
            "message": self.message,
            "recovery_attempted": self.recovery_attempted,
        }
        if self.details:
            out["details"] = self.details
        return out


# ─── ExtractionResult ────────────────────────────────────────────────────────

from typing import TYPE_CHECKING, Any, Generic, TypeVar

T = TypeVar('T')

@dataclass
class ValidationResult(Generic[T]):
    """
    Output envelope for ValidationPipeline.

    Usage
    -----
    result = pipeline.run(...)
    if result.success:
        do_something_with(result.data)
    else:
        handle_error(result.error)
    """
    success: bool
    data: T | None = None
    error: PipelineError | None = None

    @classmethod
    def ok(cls, data: T) -> "ValidationResult[T]":
        return cls(success=True, data=data, error=None)

    @classmethod
    def fail(cls, error: PipelineError) -> "ValidationResult[T]":
        return cls(success=False, data=None, error=error)

# Legacy alias for backward compatibility during refactor
ExtractionResult = ValidationResult
