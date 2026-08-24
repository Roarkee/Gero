import logging
from ai.models import AIRequest, ScopeAnalysisRecord, PricingRecord, ProposalRecord, ContractRecord, AIWorkflowTask
from ai.schemas.proj_spec_schema import ProjectSpecification
from ai.schemas.scope_schema import ScopeAnalysis
from ai.schemas.pricing_schema import PricingAnalysis
from ai.agents.contract_agent import ContractAgent
from ai.services.errors import ExtractionResult, PipelineError, ErrorType, Stage

logger = logging.getLogger(__name__)

class ContractService:
    def __init__(self):
        self.agent = ContractAgent()

    def generate_contract(self, request_id: str, workflow_task: AIWorkflowTask) -> ExtractionResult:
        ctx = f"[request_id={request_id}]"
        
        try:
            workflow_task.status = "processing"
            workflow_task.save(update_fields=["status"])

            ai_req = AIRequest.objects.get(id=request_id)
            scope_record = ScopeAnalysisRecord.objects.get(request=ai_req)
            pricing_record = PricingRecord.objects.get(request=ai_req)
            proposal_record = ProposalRecord.objects.filter(request=ai_req).last()
            
            project_spec = ProjectSpecification.model_validate(ai_req.parsed_output)
            scope_analysis = ScopeAnalysis.model_validate(scope_record.analysis)
            pricing_analysis = PricingAnalysis.model_validate(pricing_record.pricing)
            
            result = self.agent.generate(project_spec, scope_analysis, pricing_analysis, proposal_record.proposal, request_id=request_id)
            
            if result.success:
                ContractRecord.objects.create(
                    request=ai_req,
                    contract=result.data.model_dump()
                )
                workflow_task.status = "completed"
                workflow_task.save(update_fields=["status"])
            else:
                workflow_task.status = "failed"
                workflow_task.error_details = result.error.to_dict()
                workflow_task.save(update_fields=["status", "error_details"])
                
            return result
            
        except Exception as e:
            logger.exception("%s Error in ContractService: %s", ctx, e)
            error = PipelineError(
                error_type=ErrorType.UNKNOWN_ERROR,
                stage=Stage.LLM_CALL,
                message=str(e)
            )
            workflow_task.status = "failed"
            workflow_task.error_details = error.to_dict()
            workflow_task.save(update_fields=["status", "error_details"])
            return ExtractionResult.fail(error)
