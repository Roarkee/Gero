import json
import logging
from typing import Dict, Any
from django.conf import settings

from django.conf import settings

from ai.schemas.proj_spec_schema import ProjectSpecification
from ai.schemas.scope_schema import ScopeAnalysis
from ai.schemas.pricing_schema import PricingAnalysis
from ai.schemas.proposal_schema import ProposalOutput
from ai.prompts.proposal_prompt import PROPOSAL_PROMPT
from ai.services.llm import get_llm_service
from ai.services.errors import ExtractionResult, PipelineError, ErrorType, Stage
from ai.services.recovery import attempt_recovery
from pydantic import ValidationError

logger = logging.getLogger(__name__)

class ProposalAgent:
    """Agent responsible for generating a professional business proposal."""

    def __init__(self):
        self.llm = get_llm_service()
        self.prompt = PROPOSAL_PROMPT

    def generate(self, project_spec: ProjectSpecification, scope_analysis: ScopeAnalysis, pricing_analysis: PricingAnalysis, request_id: str = "unknown") -> ExtractionResult:
        ctx = f"[request_id={request_id}] [ProposalAgent]"
        
        try:
            # Prepare input data
            input_data = {
                "project_specification": project_spec.model_dump(),
                "scope_analysis": scope_analysis.model_dump(),
                "pricing_analysis": pricing_analysis.model_dump()
            }
            input_text = json.dumps(input_data, indent=2)

            # Prepare prompt with schema
            schema_json = json.dumps(ProposalOutput.model_json_schema(), indent=2)
            instructions = self.prompt.replace("{schema}", schema_json)

            logger.info("%s Invoking LLM for proposal generation...", ctx)

            raw_response = self.llm.generate(
                input=input_text,
                instructions=instructions,
                model=settings.AI_MODELS["proposal"]["model"],
                temperature=settings.AI_MODELS["proposal"]["temperature"],
                request_id=request_id,
            )

            from ai.services.pipeline import ValidationPipeline
            
            result = ValidationPipeline.run(
                llm_service=self.llm,
                schema_cls=ProposalOutput,
                prompt=instructions,
                raw_response=raw_response,
                agent_name="ProposalAgent",
                request_id=request_id,
                model=settings.AI_MODELS["proposal"]["model"],
                temperature=settings.AI_MODELS["proposal"]["temperature"]
            )
            
            if result.success:
                logger.info("%s Proposal generated successfully.", ctx)
            else:
                logger.error("%s Proposal recovery exhausted.", ctx)
                
            return result

        except Exception as e:
            logger.exception("%s Unexpected error in ProposalAgent: %s", ctx, e)
            error = PipelineError(
                error_type=ErrorType.LLM_ERROR,
                stage=Stage.LLM_CALL,
                message=str(e)
            )
            return ExtractionResult.fail(error)
