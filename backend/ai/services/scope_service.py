import logging
from ai.models import AIRequest, ScopeAnalysisRecord, AIWorkflowTask
from ai.schemas.proj_spec_schema import ProjectSpecification
from ai.agents.scope_agent import ScopeAgent
from ai.services.errors import ExtractionResult, PipelineError, ErrorType, Stage

logger = logging.getLogger(__name__)

class ScopeService:
    def __init__(self):
        self.agent = ScopeAgent()

    def analyze(self, request_id: str, workflow_task: AIWorkflowTask) -> ExtractionResult:
        ctx = f"[request_id={request_id}]"
        
        try:
            workflow_task.status = "processing"
            workflow_task.save(update_fields=["status"])

            try:
                request = AIRequest.objects.get(id=request_id)
            except AIRequest.DoesNotExist:
                raise Exception("AI Request not found")

            try:
                project_spec = ProjectSpecification.model_validate(request.parsed_output)
            except Exception:
                raise Exception("Invalid project specification")

            result = self.agent.analyze(project_spec)

            if result.success:
                ScopeAnalysisRecord.objects.create(
                    request=request,
                    analysis=result.data.model_dump()
                )
                workflow_task.status = "completed"
                workflow_task.save(update_fields=["status"])
            else:
                workflow_task.status = "failed"
                workflow_task.error_details = result.error.to_dict()
                workflow_task.save(update_fields=["status", "error_details"])
                
            return result
            
        except Exception as e:
            logger.exception("%s Error in ScopeService: %s", ctx, e)
            error = PipelineError(
                error_type=ErrorType.UNKNOWN_ERROR,
                stage=Stage.LLM_CALL,
                message=str(e)
            )
            workflow_task.status = "failed"
            workflow_task.error_details = error.to_dict()
            workflow_task.save(update_fields=["status", "error_details"])
            return ExtractionResult.fail(error)