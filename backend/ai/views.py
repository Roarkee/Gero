import logging
from pydantic import ValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from ai.models import AIRequest
from ai.serializers import AIRequestSerializer
from ai.services.ingestion import InputProcessor
from ai.agents.client_request_agent import ClientRequestAgent

logger = logging.getLogger(__name__)


class ClientRequestViewSet(ModelViewSet):
    """
    POST /api/ai-requests/
        this will accept a raw text message or a file,
        runs the extraction pipeline, and returns the stored AIRequest.

    GET /api/ai-requests/
        Returns a paginated list of all past AIRequest objects.
    """

    serializer_class = AIRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scope the queryset to only requests belonging to the logged-in user
        return AIRequest.objects.filter(user=self.request.user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        text = request.data.get("message")
        current_user = request.user

        if not file and not text:
            return Response(
                {"error": "Provide either a 'message' field or upload a 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_text: str | None = None

        try:
            raw_text = InputProcessor.process(file=file, text=text)
        except ValueError as exc:
            logger.warning("InputProcessor rejected input: %s", exc)
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Unexpected error in InputProcessor")
            AIRequest.objects.create(
                user=current_user,
                raw_input=text or "",
                parsed_output=None,
                status="failed",
            )
            return Response(
                {"error": "Failed to read input. Please check your file and try again."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        try:
            agent = ClientRequestAgent()
            result = agent.extract(raw_text)
        except ValidationError as exc:
            logger.warning("LLM output failed schema validation: %s", exc)
            AIRequest.objects.create(
                user=current_user,
                raw_input=raw_text,
                parsed_output=None,
                status="failed",
            )
            return Response(
                {
                    "error": "The AI returned a response that did not match the expected schema.",
                    "details": exc.errors(),
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except Exception as exc:
            logger.exception("LLM extraction failed for input: %.200s", raw_text)
            AIRequest.objects.create(
                user=current_user,
                raw_input=raw_text,
                parsed_output=None,
                status="failed",
            )
            return Response(
                {"error": "AI extraction service is temporarily unavailable. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        obj = AIRequest.objects.create(
            user=current_user,
            raw_input=raw_text,
            parsed_output=result.model_dump(mode="json"),
            status="completed",
        )

        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)