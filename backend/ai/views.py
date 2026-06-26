from __future__ import annotations
import logging
import uuid
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from ai.agents.client_request_agent import ClientRequestAgent
from ai.models import AIRequest, AIWorkflowTask
from ai.serializers import AIRequestSerializer
from ai.services.errors import ErrorType, Stage
from ai.services.ingestion import InputProcessor
from rest_framework.views import APIView
from .services.scope_service import ScopeService
from .services.pricing_service import PricingService
from .services.proposal_service import ProposalService

logger = logging.getLogger(__name__)


class ClientRequestViewSet(ModelViewSet):
    """
    GET  /api/ai/ai-requests/        — paginated list of the current user's requests.
    POST /api/ai/ai-requests/        — submit a new project spec extraction request.

    All other HTTP methods (PUT, PATCH, DELETE) are blocked (405).
    """

    serializer_class = AIRequestSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return AIRequest.objects.filter(user=self.request.user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        request_id = uuid.uuid4().hex[:12]
        ctx = f"[request_id={request_id}]"

        current_user = request.user
        file = request.FILES.get("file")
        text = request.data.get("message")

        logger.info(
            "%s Incoming extraction request | user=%s has_file=%s has_text=%s",
            ctx,
            current_user.pk,
            bool(file),
            bool(text),
        )

        if not file and not text:
            return Response(
                {"error": "Provide either a 'message' field or upload a 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            raw_text = InputProcessor.process(file=file, text=text)
        except ValueError as exc:
            logger.warning("%s InputProcessor rejected input: %s", ctx, exc)
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            logger.exception("%s Unexpected error in InputProcessor", ctx)
            return Response(
                {"error": "Failed to read input. Please check your file and try again."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        ai_request = AIRequest.objects.create(
            user=current_user,
            raw_input=raw_text,
            status="pending",
        )

        workflow_task = AIWorkflowTask.objects.create(
            request=ai_request,
            task_type="extraction",
            status="processing"
        )

        logger.info(
            "%s AIRequest created as pending | ai_request_id=%s",
            ctx,
            ai_request.pk,
        )

        agent = ClientRequestAgent()
        result = agent.extract(raw_text, request_id=request_id)

        if result.success:
            spec = result.data
            ai_request.parsed_output = spec.model_dump(mode="json")
            ai_request.status = "completed"
            ai_request.save(update_fields=["parsed_output", "status", "updated_at"])

            workflow_task.status = "completed"
            workflow_task.save(update_fields=["status"])

            logger.info(
                "%s Extraction succeeded | ai_request_id=%s project_type=%s",
                ctx,
                ai_request.pk,
                spec.project_type,
            )

            serializer = self.get_serializer(ai_request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        error = result.error

        ai_request.status = "failed"
        ai_request.error_details = error.to_dict()
        ai_request.recovery_attempted = error.recovery_attempted
        ai_request.save(
            update_fields=[
                "status",
                "error_details",
                "recovery_attempted",
                "updated_at",
            ]
        )

        workflow_task.status = "failed"
        workflow_task.error_details = error.to_dict()
        workflow_task.save(update_fields=["status", "error_details"])

        logger.warning(
            "%s Extraction failed | ai_request_id=%s error_type=%s stage=%s",
            ctx,
            ai_request.pk,
            error.error_type,
            error.stage,
        )

        # Map error type to HTTP status code
        if error.error_type == ErrorType.INPUT_ERROR:
            http_status = status.HTTP_400_BAD_REQUEST
        elif error.error_type == ErrorType.LLM_ERROR:
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE
        else:
            # VALIDATION_ERROR, RECOVERY_EXHAUSTED, UNKNOWN
            http_status = status.HTTP_422_UNPROCESSABLE_ENTITY

        return Response(
            error.to_response_dict(),
            status=http_status,
        )
    



class ScopeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_id = request.data.get("request_id")
        
        try:
            ai_req = AIRequest.objects.get(id=request_id, user=request.user)
        except AIRequest.DoesNotExist:
            return Response({"error": "AIRequest not found"}, status=status.HTTP_404_NOT_FOUND)

        workflow_task = AIWorkflowTask.objects.create(
            request=ai_req,
            task_type="scope_analysis",
            status="pending"
        )
        
        service = ScopeService()
        result = service.analyze(request_id, workflow_task)
        
        if result.success:
            return Response(result.data.model_dump(), status=status.HTTP_200_OK)
        else:
            return Response(result.error.to_response_dict(), status=status.HTTP_422_UNPROCESSABLE_ENTITY)


class PricingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_id = request.data.get("request_id")
        
        try:
            ai_req = AIRequest.objects.get(id=request_id, user=request.user)
        except AIRequest.DoesNotExist:
            return Response({"error": "AIRequest not found"}, status=status.HTTP_404_NOT_FOUND)

        workflow_task = AIWorkflowTask.objects.create(
            request=ai_req,
            task_type="pricing",
            status="pending"
        )
        
        service = PricingService()
        result = service.generate_pricing(request_id, workflow_task)
        
        if result.success:
            return Response(result.data.model_dump(), status=status.HTTP_200_OK)
        else:
            return Response(result.error.to_response_dict(), status=status.HTTP_422_UNPROCESSABLE_ENTITY)


class ProposalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_id = request.data.get("request_id")
        
        try:
            ai_req = AIRequest.objects.get(id=request_id, user=request.user)
        except AIRequest.DoesNotExist:
            return Response({"error": "AIRequest not found"}, status=status.HTTP_404_NOT_FOUND)

        workflow_task = AIWorkflowTask.objects.create(
            request=ai_req,
            task_type="proposal_generation",
            status="pending"
        )
        
        service = ProposalService()
        result = service.generate_proposal(request_id, workflow_task)
        
        if result.success:
            return Response(result.data.model_dump(), status=status.HTTP_200_OK)
        else:
            return Response(result.error.to_response_dict(), status=status.HTTP_422_UNPROCESSABLE_ENTITY)