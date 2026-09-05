import json
import logging
from typing import Dict, Any
from django.conf import settings

from django.conf import settings

from ai.schemas.proj_spec_schema import ProjectSpecification
from ai.schemas.scope_schema import ScopeAnalysis
from ai.schemas.pricing_schema import PricingAnalysis
from ai.prompts.pricing_prompt import PRICING_PROMPT
from ai.services.llm import get_llm_service
from ai.services.errors import ExtractionResult, PipelineError, ErrorType, Stage
from ai.services.recovery import attempt_recovery
from pydantic import ValidationError

logger = logging.getLogger(__name__)

class PricingAgent:
    """Agent responsible for determining professional project pricing."""

    def __init__(self):
        self.llm = get_llm_service()
        self.prompt = PRICING_PROMPT

    def analyze(self, project_spec: ProjectSpecification, scope_analysis: ScopeAnalysis, feedback: str = "", request_id: str = "unknown") -> ExtractionResult:
        ctx = f"[request_id={request_id}] [PricingAgent]"
        
        try:
            # Prepare input data
            input_data = {
                "project_specification": project_spec.model_dump(),
                "scope_analysis": scope_analysis.model_dump()
            }
            input_text = json.dumps(input_data, indent=2)

            # Prepare prompt with schema
            schema_json = json.dumps(PricingAnalysis.model_json_schema(), indent=2)
            instructions = self.prompt.replace("{schema}", schema_json)
            
            if feedback:
                instructions += f"\n\nIMPORTANT FEEDBACK FROM USER:\nThe user rejected your previous output. Please regenerate and incorporate this feedback exactly: {feedback}"

            logger.info("%s Invoking LLM for pricing generation...", ctx)

            raw_response = self.llm.generate(
                input=input_text,
                instructions=instructions,
                model=settings.AI_MODELS["pricing"]["model"],
                temperature=settings.AI_MODELS["pricing"]["temperature"],
                request_id=request_id,
            )

            from ai.services.pipeline import ValidationPipeline
            
            result = ValidationPipeline.run(
                llm_service=self.llm,
                schema_cls=PricingAnalysis,
                prompt=instructions,
                raw_response=raw_response,
                agent_name="PricingAgent",
                request_id=request_id,
                model=settings.AI_MODELS["pricing"]["model"],
                temperature=settings.AI_MODELS["pricing"]["temperature"]
            )
            
            if result.success:
                logger.info("%s Pricing generated successfully.", ctx)
            else:
                logger.error("%s Pricing recovery exhausted.", ctx)
                
            return result

        except Exception as e:
            logger.exception("%s Unexpected error in PricingAgent: %s", ctx, e)
            error = PipelineError(
                error_type=ErrorType.LLM_ERROR,
                stage=Stage.LLM_CALL,
                message=str(e)
            )
            return ExtractionResult.fail(error)
