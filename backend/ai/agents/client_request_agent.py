from ..prompts.proj_spec_prompt import EXTRACTION_PROMPT
from ..services.llm.openai_llm import OpenAILLM
from django.conf import settings
from ..schemas.proj_spec_schema import ProjectSpecification

class ClientRequestAgent:
    prompt = EXTRACTION_PROMPT
    def __init__(self):
        self.llm = OpenAILLM()

    def extract(self, client_message):

        result = self.llm.generate(
            input=client_message,
            instructions=self.prompt, 
            temperature=settings.O_EXTRACTION_TEMP,
            model = settings.OPENAI_DEFAULT_MODEL)
        validated = ProjectSpecification.model_json_schema(result)

        return validated