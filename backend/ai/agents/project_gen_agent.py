import json
from ai.schemas.project_plan_schema import ProjectPlan
from ai.prompts.project_plan_prompt import PROJECT_PLAN_PROMPT
from ai.services.pipeline import ValidationPipeline
from ai.services.errors import ExtractionResult
from ai.services.llm import get_llm_service
from django.conf import settings

class ProjectGenerationAgent:
    def __init__(self):
        self.llm = get_llm_service()
        self.model = settings.AI_MODELS["project_generation"]["model"]
        self.temperature = settings.AI_MODELS["project_generation"]["temperature"]

    def generate(self, project_spec, scope_analysis, pricing_analysis, proposal_output, request_id: str) -> ExtractionResult[ProjectPlan]:
        ctx = f"[request_id={request_id}]"
        
        # We assume the inputs are either Pydantic models or dicts. We need them as dicts to dump to JSON.
        spec_data = project_spec.model_dump() if hasattr(project_spec, "model_dump") else project_spec
        scope_data = scope_analysis.model_dump() if hasattr(scope_analysis, "model_dump") else scope_analysis
        pricing_data = pricing_analysis.model_dump() if hasattr(pricing_analysis, "model_dump") else pricing_analysis
        proposal_data = proposal_output.model_dump() if hasattr(proposal_output, "model_dump") else proposal_output

        input_data = {
            "project_specification": spec_data,
            "scope_analysis": scope_data,
            "pricing_analysis": pricing_data,
            "proposal": proposal_data,
        }
        
        prompt_input = json.dumps(input_data, indent=2)
        
        raw_response = self.llm.generate(
            input=prompt_input,
            instructions=PROJECT_PLAN_PROMPT,
            model=self.model,
            temperature=self.temperature,
            request_id=request_id
        )
        
        result = ValidationPipeline.run(
            llm_service=self.llm,
            schema_cls=ProjectPlan,
            prompt=PROJECT_PLAN_PROMPT,
            raw_response=raw_response,
            agent_name="ProjectGenerationAgent",
            request_id=request_id,
            model=self.model,
            temperature=self.temperature,
        )
        
        return result
