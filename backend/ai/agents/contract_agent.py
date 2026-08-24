import json
import logging
from typing import Dict, Any
from django.conf import settings

from ai.schemas.proj_spec_schema import ProjectSpecification
from ai.schemas.scope_schema import ScopeAnalysis
from ai.schemas.pricing_schema import PricingAnalysis
from ai.schemas.contract_schema import ContractAnalysis
from ai.prompts.contract_prompt import CONTRACT_PROMPT
from ai.services.llm import get_llm_service
from ai.services.errors import ExtractionResult, PipelineError, ErrorType, Stage

logger = logging.getLogger(__name__)

class ContractAgent:
    """Agent responsible for generating a professional freelance contract."""

    def __init__(self):
        self.llm = get_llm_service()
        self.prompt = CONTRACT_PROMPT

    def generate(self, project_spec: ProjectSpecification, scope_analysis: ScopeAnalysis, pricing_analysis: PricingAnalysis, proposal: Dict[str, Any], request_id: str = "unknown") -> ExtractionResult:
        ctx = f"[request_id={request_id}] [ContractAgent]"
        
        try:
            # Prepare input data
            input_data = {
                "project_specification": project_spec.model_dump(),
                "scope_analysis": scope_analysis.model_dump(),
                "pricing_analysis": pricing_analysis.model_dump(),
                "proposal": proposal
            }
            input_text = json.dumps(input_data, indent=2)

            # Prepare prompt with schema
            schema_json = json.dumps(ContractAnalysis.model_json_schema(), indent=2)
            instructions = self.prompt.replace("{schema}", schema_json)

            logger.info("%s Invoking LLM for contract generation...", ctx)

            raw_response = self.llm.generate(
                input=input_text,
                instructions=instructions,
                model=settings.AI_MODELS["contract"]["model"],
                temperature=settings.AI_MODELS["contract"]["temperature"],
                request_id=request_id,
            )
            
            # Clean up known LLM JSON quirks (invalid single quote escapes)
            raw_response = raw_response.replace(r"\'", "'")

            from ai.services.pipeline import ValidationPipeline
            
            result = ValidationPipeline.run(
                llm_service=self.llm,
                schema_cls=ContractAnalysis,
                prompt=instructions,
                raw_response=raw_response,
                agent_name="ContractAgent",
                request_id=request_id,
                model=settings.AI_MODELS["contract"]["model"],
                temperature=settings.AI_MODELS["contract"]["temperature"]
            )
            
            if result.success:
                logger.info("%s Contract generated successfully.", ctx)
            else:
                logger.error("%s Contract recovery exhausted.", ctx)
                
            return result

        except Exception as e:
            logger.exception("%s Unexpected error in ContractAgent: %s", ctx, e)
            error = PipelineError(
                error_type=ErrorType.LLM_ERROR,
                stage=Stage.LLM_CALL,
                message=str(e)
            )
            return ExtractionResult.fail(error)
