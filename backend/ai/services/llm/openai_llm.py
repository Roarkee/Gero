from __future__ import annotations
import logging
from openai import (APIConnectionError,InternalServerError,OpenAI,OpenAIError,RateLimitError,)
from tenacity import (RetryCallState,before_sleep_log,retry,retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)
from django.conf import settings

logger = logging.getLogger(__name__)

#: Errors that are safe to retry (transient / infrastructure faults).
_TRANSIENT_ERRORS = (RateLimitError, APIConnectionError, InternalServerError)

#: Maximum number of total attempts (1 original + N-1 retries).
_MAX_ATTEMPTS: int = 5

#: Minimum wait between retries (seconds).
_WAIT_MIN: int = 2

#: Maximum wait between retries (seconds).
_WAIT_MAX: int = 30


def _log_retry(retry_state: RetryCallState) -> None:
    exc = retry_state.outcome.exception()
    attempt = retry_state.attempt_number
    next_wait = getattr(retry_state.next_action, "sleep", "?")
    logger.warning(
        "OpenAI transient error (attempt %d/%d), retrying in %.1fs | error=%s: %s",
        attempt,
        _MAX_ATTEMPTS,
        next_wait,
        type(exc).__name__,
        exc,
    )

class OpenAILLM:

    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    @retry(
        stop=stop_after_attempt(_MAX_ATTEMPTS),
        wait=wait_random_exponential(min=_WAIT_MIN, max=_WAIT_MAX),
        retry=retry_if_exception_type(_TRANSIENT_ERRORS),
        before_sleep=_log_retry,
        reraise=True,
    )
    def generate(self,*,input: str,instructions: str,model: str,temperature: float,request_id: str = "",) -> str:
        """
        Call the OpenAI Responses API and return the raw text output.

        Parameters
        ----------
        input        : The user content (sanitized client request).
        instructions : System-level prompt (extraction template).
        model        : OpenAI model identifier (e.g. "gpt-5").
        temperature  : Sampling temperature.
        request_id   : Optional correlation ID for log tracing.

        Returns
        -------
        Raw string output from the LLM.

        Raises
        ------
        OpenAIError         : On non-transient API errors (not retried).
        ValueError          : If the API returns an empty / missing response.
        tenacity.RetryError : If all retry attempts on transient errors fail.
        """
        ctx = f"[request_id={request_id}] " if request_id else ""

        logger.info("%sSending request to OpenAI | model=%s input_chars=%d",ctx,model,len(input),)

        response = self.client.responses.create(
            model=model,
            input=input,
            instructions=instructions,
            temperature=temperature,
            timeout=60,
        )

        output_text: str | None = getattr(response, "output_text", None)

        if not output_text:
            raise ValueError(
                "OpenAI returned an empty or missing output_text. "
                "The model may have been content-filtered or the response was malformed."
            )

        logger.info(
            "%sOpenAI response received | model=%s output_chars=%d",
            ctx,
            model,
            len(output_text),
        )

        return output_text