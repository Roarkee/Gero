import logging
from django.db import transaction
from ai.models import AIRequest, ScopeAnalysisRecord, PricingRecord, ProposalRecord, AIWorkflowTask
from ai.schemas.proj_spec_schema import ProjectSpecification
from ai.schemas.scope_schema import ScopeAnalysis
from ai.schemas.pricing_schema import PricingAnalysis
from ai.schemas.proposal_schema import ProposalOutput
from ai.agents.project_gen_agent import ProjectGenerationAgent
from ai.services.errors import ExtractionResult, PipelineError, ErrorType, Stage
from projects.models import Project, TaskList, Task, SubTask

logger = logging.getLogger(__name__)

class ProjectGenerationService:
    def __init__(self):
        self.agent = ProjectGenerationAgent()

    def generate_project(self, request_id: str, workflow_task: AIWorkflowTask) -> ExtractionResult:
        ctx = f"[request_id={request_id}]"
        
        try:
            workflow_task.status = "processing"
            workflow_task.save(update_fields=["status"])

            ai_req = AIRequest.objects.get(id=request_id)
            scope_record = ScopeAnalysisRecord.objects.filter(request=ai_req).last()
            pricing_record = PricingRecord.objects.filter(request=ai_req).last()
            proposal_record = ProposalRecord.objects.filter(request=ai_req).last()
            
            if not scope_record or not pricing_record or not proposal_record:
                raise ValueError("Missing prerequisite records (Scope, Pricing, or Proposal).")

            project_spec = ProjectSpecification.model_validate(ai_req.parsed_output)
            scope_analysis = ScopeAnalysis.model_validate(scope_record.analysis)
            pricing_analysis = PricingAnalysis.model_validate(pricing_record.pricing)
            proposal_output = ProposalOutput.model_validate(proposal_record.proposal)
            
            # Step 1: AI generates structured project plan
            result = self.agent.generate(
                project_spec=project_spec,
                scope_analysis=scope_analysis, 
                pricing_analysis=pricing_analysis, 
                proposal_output=proposal_output,
                request_id=request_id
            )
            
            if not result.success:
                workflow_task.status = "failed"
                workflow_task.error_details = result.error.to_dict()
                workflow_task.save(update_fields=["status", "error_details"])
                return result

            project_plan = result.data
            
            # Step 2: Create Gero Database Models
            with transaction.atomic():
                project = Project.objects.create(
                    user=ai_req.user,
                    name=project_plan.title[:100],
                    description=project_plan.description or "",
                    priority=project_plan.priority,
                    budget=project_plan.budget,
                )
                
                for list_position, task_list_plan in enumerate(project_plan.task_lists):
                    task_list = TaskList.objects.create(
                        project=project,
                        name=task_list_plan.name[:100],
                        position=list_position
                    )
                    
                    for task_position, task_plan in enumerate(task_list_plan.tasks):
                        task = Task.objects.create(
                            task_list=task_list,
                            title=task_plan.title[:40],
                            description=(task_plan.description or "")[:255],
                            estimated_hours=task_plan.estimated_hours,
                            priority=task_plan.priority,
                            position=task_position
                        )
                        
                        for subtask_position, subtask_plan in enumerate(task_plan.subtasks):
                            SubTask.objects.create(
                                task=task,
                                todo=subtask_plan.todo[:255],
                                position=subtask_position
                            )

            workflow_task.status = "completed"
            
            # Attach the generated project id to metadata so frontend can redirect
            workflow_task.metadata = {"project_id": project.id}
            workflow_task.save(update_fields=["status", "metadata"])
            
            # Note: We return the project ID wrapped in the Result
            # The schema technically expects Pydantic model for data, but we can just return a dict
            # since the View will serialize it. We'll bypass ValidationPipeline's strictness here manually
            # or just return a dummy BaseModel. We will just return the project details directly.
            class GeneratedProjectResponse:
                def __init__(self, project_id):
                    self.project_id = project_id
                def model_dump(self):
                    return {"project_id": self.project_id}
            
            return ExtractionResult.ok(GeneratedProjectResponse(project.id))
            
        except Exception as e:
            logger.exception("%s Error in ProjectGenerationService: %s", ctx, e)
            error = PipelineError(
                error_type=ErrorType.UNKNOWN_ERROR,
                stage=Stage.LLM_CALL,
                message=str(e)
            )
            workflow_task.status = "failed"
            workflow_task.error_details = error.to_dict()
            workflow_task.save(update_fields=["status", "error_details"])
            return ExtractionResult.fail(error)
