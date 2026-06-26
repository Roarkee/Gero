import logging

from django.conf import settings

from ..prompts.proj_spec_prompt import EXTRACTION_PROMPT
from ..services.llm.openai_llm import OpenAILLM
from ..schemas.proj_spec_schema import ProjectSpecification

logger = logging.getLogger(__name__)


class ClientRequestAgent:

    prompt = EXTRACTION_PROMPT

    def __init__(self) -> None:
        self.llm = OpenAILLM()

    def extract(self, client_message: str) -> ProjectSpecification:
        logger.info(
            "Extracting project spec | input_length=%d chars", len(client_message)
        )

        raw = self.llm.generate(
            input=client_message,
            instructions=self.prompt,
            temperature=settings.O_EXTRACTION_TEMP,
            model=settings.OPENAI_DEFAULT_MODEL,
        )

        validated = ProjectSpecification.model_validate_json(raw)

        logger.info(
            "Extraction complete | project_type=%s urgency=%s confidence=%s",
            validated.project_type,
            validated.urgency,
            validated.metadata.confidence_score if validated.metadata else "n/a",
        )

        return validated