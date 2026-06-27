from ai.services.llm import LLMFactory
from ai.prompts.scope_prompt import SCOPE_PROMPT
from django.conf import settings
from ai.schemas.scope_schema import ScopeAnalysis
class ScopeAgent:

    prompt = SCOPE_PROMPT


    def __init__(self):
        self.llm = LLMFactory.get_provider(settings.AI_PROVIDER)


    def analyze(
        self,
        project_spec
    ):

        result = self.llm.generate(

            input=project_spec.model_dump_json(),

            instructions=self.prompt,

            model=settings.AI_MODELS["scope"]["model"],

            temperature=settings.AI_MODELS["scope"]["temperature"]
        )

        validated = ScopeAnalysis.model_validate_json(
            result
        )

        return validated