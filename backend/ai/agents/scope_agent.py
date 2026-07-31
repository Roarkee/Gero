from ai.services.llm import get_llm_service
from ai.prompts.scope_prompt import SCOPE_PROMPT
from django.conf import settings
from ai.schemas.scope_schema import ScopeAnalysis
class ScopeAgent:

    prompt = SCOPE_PROMPT


    def __init__(self):
        self.llm = get_llm_service()


    def analyze(
        self,
        project_spec,
        request_id: str = ""
    ):
        raw = self.llm.generate(
            input=project_spec.model_dump_json(),
            instructions=self.prompt,
            model=settings.AI_MODELS["scope"]["model"],
            temperature=settings.AI_MODELS["scope"]["temperature"],
            request_id=request_id
        )

        from ai.services.pipeline import ValidationPipeline
        result = ValidationPipeline.run(
            llm_service=self.llm,
            schema_cls=ScopeAnalysis,
            prompt=self.prompt,
            raw_response=raw,
            agent_name="ScopeAgent",
            request_id=request_id,
            model=settings.AI_MODELS["scope"]["model"],
            temperature=settings.AI_MODELS["scope"]["temperature"]
        )
        
        return result