import logging
from openai import OpenAI
from openai import (OpenAIError, RateLimitError, APIConnectionError, InternalServerError)
from django.conf import settings
from tenacity import (retry,stop_after_attempt,wait_exponential,retry_if_exception_type,before_sleep_log)

logger = logging.getLogger(__name__)


class OpenAILLM:

    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(
            (RateLimitError, APIConnectionError, InternalServerError)
        ),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    def generate(self,*,input: str,instructions: str,model: str,temperature: float,) -> str:
      
        logger.info("Sending request to OpenAI | model=%s", model)

        try:
            response = self.client.responses.create(
                model=model,
                input=input,
                instructions=instructions,
                temperature=temperature,
                timeout=60,
            )
        except OpenAIError as exc:
            logger.error("OpenAI API error: %s", exc)
            raise

        logger.info("OpenAI request completed successfully")
        return response.output_text