from __future__ import annotations

import logging

from google import genai
from google.genai import types as genai_types
from google.genai.errors import ClientError, ServerError
from django.conf import settings
from tenacity import (
    RetryCallState,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_random_exponential,
)

logger = logging.getLogger(__name__)

_MAX_ATTEMPTS: int = 5
_WAIT_MIN: int = 2
_WAIT_MAX: int = 60   # wider ceiling — 429 retry hints can be up to ~30s


def _log_retry(retry_state: RetryCallState) -> None:
    exc = retry_state.outcome.exception()
    attempt = retry_state.attempt_number
    next_wait = getattr(retry_state.next_action, "sleep", "?")
    logger.warning(
        "Gemini transient error (attempt %d/%d), retrying in %.1fs | error=%s: %s",
        attempt,
        _MAX_ATTEMPTS,
        next_wait,
        type(exc).__name__,
        exc,
    )


def _is_retryable(exc: BaseException) -> bool:
    """
    Return True only for transient faults worth retrying.

    google.genai raises ClientError for 4xx and ServerError for 5xx.
    - 429 RESOURCE_EXHAUSTED  → retry (rate limit, not quota wall)
    - 503 / 500               → retry (transient server fault)
    - 400 / 401 / 403         → do NOT retry (bad request, auth failure, billing wall)

    A 429 with limit=0 is a billing quota wall, not a transient rate limit.
    We detect this by looking for the "limit: 0" string in the error message,
    and skip retrying in that case.
    """
    if isinstance(exc, ServerError):
        # 5xx — always transient
        return True

    if isinstance(exc, ClientError):
        code = getattr(exc, "code", None) or getattr(exc, "status_code", None)

        # Try to extract HTTP status from the error if code attr is missing
        if code is None:
            msg = str(exc)
            for candidate in ("429", "503", "500", "502"):
                if candidate in msg:
                    code = int(candidate)
                    break

        if code == 429:
            # Hard quota wall: limit is 0, retrying won't help
            if "limit: 0" in str(exc):
                logger.error(
                    "Gemini quota exhausted (billing limit=0). "
                    "Enable billing at https://aistudio.google.com to continue."
                )
                return False
            return True  # transient rate limit — retry

        if code in (500, 502, 503):
            return True

    # Also handle google.api_core exceptions if they surface
    try:
        from google.api_core.exceptions import (
            InternalServerError,
            ResourceExhausted,
            ServiceUnavailable,
        )
        if isinstance(exc, (ResourceExhausted, InternalServerError, ServiceUnavailable)):
            return True
    except ImportError:
        pass

    return False


# ── Model name normalisation ───────────────────────────────────────────────────
_MODEL_MAP: dict[str, str] = {
    # OpenAI aliases
    "gpt-5":         "models/gemini-2.0-flash-lite",
    "gpt-5-mini":    "models/gemini-2.0-flash-lite",
    "gpt-4o":        "models/gemini-2.0-flash-lite",
    "gpt-4o-mini":   "models/gemini-2.0-flash-lite",
    "gpt-4":         "models/gemini-2.0-flash-lite",
    "gpt-3.5-turbo": "models/gemini-2.0-flash-lite",
    # Anthropic aliases
    "claude-sonnet-4-5":          "models/gemini-2.0-flash-lite",
    "claude-sonnet-4":            "models/gemini-2.0-flash-lite",
    "claude-3-5-sonnet-20241022": "models/gemini-2.0-flash-lite",
    "claude-3-5-sonnet-latest":   "models/gemini-2.0-flash-lite",
    "claude-3-5-haiku-20241022":  "models/gemini-2.0-flash-lite",
}


def _resolve_model(model: str) -> str:
    if model in _MODEL_MAP:
        resolved = _MODEL_MAP[model]
        logger.debug("Gemini: mapped model '%s' → '%s'", model, resolved)
        return resolved
    if model.startswith("gemini"):
        return model
    default = getattr(settings, "GEMINI_MODEL", "models/gemini-2.0-flash-lite")
    logger.debug("Gemini: unknown model '%s', using default '%s'", model, default)
    return default


class GeminiService:
    """
    Drop-in replacement for AnthropicService and OpenAILLM.

    Public interface:
        generate(*, input, instructions, model, temperature, request_id="") -> str
    """

    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    @retry(
        stop=stop_after_attempt(_MAX_ATTEMPTS),
        wait=wait_random_exponential(min=_WAIT_MIN, max=_WAIT_MAX),
        retry=retry_if_exception(_is_retryable),
        before_sleep=_log_retry,
        reraise=True,
    )
    def generate(
        self,
        *,
        input: str,
        instructions: str,
        model: str,
        temperature: float,
        request_id: str = "",
    ) -> str:
        ctx = f"[request_id={request_id}] " if request_id else ""
        resolved_model = _resolve_model(model)

        logger.info(
            "%sSending request to Gemini | model=%s input_chars=%d",
            ctx,
            resolved_model,
            len(input),
        )

        config = genai_types.GenerateContentConfig(
            system_instruction=instructions,
            temperature=temperature,
            response_mime_type="application/json",
        )

        response = self.client.models.generate_content(
            model=resolved_model,
            contents=input,
            config=config,
        )

        output_text: str | None = None
        try:
            output_text = response.text
        except Exception:
            pass

        if not output_text or not output_text.strip():
            finish_reason = None
            try:
                finish_reason = response.candidates[0].finish_reason if response.candidates else None
            except Exception:
                pass

            raise ValueError(
                f"Gemini returned an empty or blocked response. "
                f"finish_reason={finish_reason}. "
                "The model may have been content-filtered or the response was malformed."
            )

        logger.info(
            "%sGemini response received | model=%s output_chars=%d",
            ctx,
            resolved_model,
            len(output_text),
        )

        return output_text
