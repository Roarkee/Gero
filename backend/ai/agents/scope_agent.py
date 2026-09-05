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
        feedback: str = "",
        request_id: str = ""
    ):
        active_prompt = self.prompt
        if feedback:
            active_prompt += f"\n\nIMPORTANT FEEDBACK FROM USER:\nThe user rejected your previous output. Please regenerate and incorporate this feedback exactly: {feedback}"

        raw = self.llm.generate(
            input=project_spec.model_dump_json(),
            instructions=active_prompt,
            model=settings.AI_MODELS["scope"]["model"],
            temperature=settings.AI_MODELS["scope"]["temperature"],
            request_id=request_id
        )

        from ai.services.pipeline import ValidationPipeline
        result = ValidationPipeline.run(
            llm_service=self.llm,
            schema_cls=ScopeAnalysis,
            prompt=active_prompt,
            raw_response=raw,
            agent_name="ScopeAgent",
            request_id=request_id,
            model=settings.AI_MODELS["scope"]["model"],
            temperature=settings.AI_MODELS["scope"]["temperature"]
        )
        
        return result