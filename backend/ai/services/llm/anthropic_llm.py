from __future__ import annotations

import logging

import anthropic
from anthropic import (
    APIConnectionError,
    APIStatusError,
    InternalServerError,
    RateLimitError,
)
from django.conf import settings
from tenacity import (
    RetryCallState,
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)

logger = logging.getLogger(__name__)

_TRANSIENT_ERRORS = (RateLimitError, APIConnectionError, InternalServerError)

_MAX_ATTEMPTS: int = 5
_WAIT_MIN: int = 2
_WAIT_MAX: int = 30
_REQUEST_TIMEOUT: float = 60.0


def _log_retry(retry_state: RetryCallState) -> None:
    exc = retry_state.outcome.exception()
    attempt = retry_state.attempt_number
    next_wait = getattr(retry_state.next_action, "sleep", "?")
    logger.warning(
        "Anthropic transient error (attempt %d/%d), retrying in %.1fs | error=%s: %s",
        attempt,
        _MAX_ATTEMPTS,
        next_wait,
        type(exc).__name__,
        exc,
    )


class AnthropicService:

    def __init__(self) -> None:
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

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

        logger.info(
            "%sSending request to Anthropic | model=%s input_chars=%d",
            ctx,
            model,
            len(input),
        )

        try:
            message = self.client.messages.create(
                model=model,
                max_tokens=8096,
                temperature=temperature,
                system=instructions,
                messages=[{"role": "user", "content": input}],
                timeout=_REQUEST_TIMEOUT,
            )
        except APIStatusError as exc:
            if exc.status_code in (400, 401, 403):
                logger.error(
                    "%sAnthropicAPIStatusError (non-retried) | status=%d error=%s",
                    ctx,
                    exc.status_code,
                    exc,
                )
                raise
            raise

        output_text: str | None = None
        if message.content and len(message.content) > 0:
            block = message.content[0]
            if hasattr(block, "text"):
                output_text = block.text

        if not output_text:
            raise ValueError(
                "Anthropic returned an empty or missing content block. "
                "The model may have been content-filtered or the response was malformed."
            )

        logger.info(
            "%sAnthropic response received | model=%s output_chars=%d stop_reason=%s",
            ctx,
            model,
            len(output_text),
            message.stop_reason,
        )

        return output_text
