from __future__ import annotations

import logging
from django.conf import settings
from groq import (
    Groq,
    APIConnectionError,
    InternalServerError,
    RateLimitError,
)
from tenacity import (
    RetryCallState,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)

logger = logging.getLogger(__name__)

#: Errors that are safe to retry (transient / infrastructure faults).
_TRANSIENT_ERRORS = (RateLimitError, APIConnectionError, InternalServerError)

#: Maximum number of total attempts (1 original + N-1 retries).
_MAX_ATTEMPTS: int = 5

#: Minimum wait between retries (seconds).
_WAIT_MIN: int = 2

#: Maximum wait between retries (seconds).
_WAIT_MAX: int = 30

_DEFAULT_MODEL = "openai/gpt-oss-20b"
_FAST_MODEL = "openai/gpt-oss-20b"


def _log_retry(retry_state: RetryCallState) -> None:
    exc = retry_state.outcome.exception()
    attempt = retry_state.attempt_number
    next_wait = getattr(retry_state.next_action, "sleep", "?")
    logger.warning(
        "Groq transient error (attempt %d/%d), retrying in %.1fs | error=%s: %s",
        attempt,
        _MAX_ATTEMPTS,
        next_wait,
        type(exc).__name__,
        exc,
    )


class GroqService:
    """
    Service wrapper for Groq LLM API.
    """

    def __init__(self) -> None:
        api_key = getattr(settings, "GROQ_API_KEY", None)
        self.client = Groq(api_key=api_key)

    @retry(
        stop=stop_after_attempt(_MAX_ATTEMPTS),
        wait=wait_random_exponential(min=_WAIT_MIN, max=_WAIT_MAX),
        retry=retry_if_exception_type(_TRANSIENT_ERRORS),
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

        # Map non-Groq model names (e.g. gpt-*, claude-*, gemini-*) to Groq equivalent
        # Note: Groq's custom enterprise models sometimes use 'gpt-oss' so we shouldn't remap those
        target_model = model
        if not target_model or (any(prefix in target_model.lower() for prefix in ["gpt", "claude", "gemini"]) and "gpt-oss" not in target_model.lower()):
            if "haiku" in target_model.lower() or "mini" in target_model.lower() or "flash" in target_model.lower():
                target_model = getattr(settings, "GROQ_FAST_MODEL", _FAST_MODEL)
            else:
                target_model = getattr(settings, "GROQ_MODEL", _DEFAULT_MODEL)

        logger.info(
            "%sSending request to Groq | model=%s input_chars=%d",
            ctx,
            target_model,
            len(input),
        )

        messages = []
        if instructions:
            messages.append({"role": "system", "content": instructions})
        messages.append({"role": "user", "content": input})

        response = self.client.chat.completions.create(
            model=target_model,
            messages=messages,
            temperature=temperature,
            max_tokens=8000,
            timeout=180,
        )

        output_text: str | None = None
        if response.choices and len(response.choices) > 0:
            output_text = response.choices[0].message.content

        if not output_text:
            raise ValueError(
                "Groq returned an empty or missing response content. "
                "The model may have been content-filtered or the response was malformed."
            )

        logger.info(
            "%sGroq response received | model=%s output_chars=%d",
            ctx,
            target_model,
            len(output_text),
        )

        return output_text
