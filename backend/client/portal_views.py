"""
Client Collaboration Portal — API views.

Access rules:
  - IsClientUser: only users with role='client' who have a linked Client profile.
  - Each endpoint is scoped to the client's own projects so a client can never
    see another client's data.

Surfaces:
  /api/portal/projects/                    — list projects the client is on
  /api/portal/projects/<id>/               — project overview + task progress
  /api/portal/projects/<id>/messages/      — messaging thread for a project
  /api/portal/projects/<id>/files/         — project-level file attachments
  /api/portal/projects/<id>/proposals/     — proposals awaiting client review
  /api/portal/projects/<id>/proposals/<id>/approve|reject|request_revision
  /api/portal/invoices/                    — invoices belonging to this client
  /api/portal/invoices/<id>/               — invoice detail
  /api/portal/invoices/<id>/mark_viewed/   — transition sent→viewed
"""
from rest_framework import permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet, ModelViewSet, ReadOnlyModelViewSet
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone

from .models import Client, PortalMessage, PortalProposal
from core.permissions import IsClientUser
from invoices.models import Invoice, InvoiceItem, InvoicePayment
from projects.models import Project, TaskList, Task, Attachment


# ─────────────────────────── helpers ──────────────────────────────────────────

def _owned_project(user, project_pk):
    """Return a project where the current user is the client."""
    return get_object_or_404(Project, pk=project_pk, client__user_account=user)



# ─────────────────────────── serializers ──────────────────────────────────────

class PortalTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'priority', 'completed', 'due_date']


class PortalTaskListSerializer(serializers.ModelSerializer):
    tasks = PortalTaskSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    done = serializers.SerializerMethodField()

    class Meta:
        model = TaskList
        fields = ['id', 'name', 'list_type', 'total', 'done', 'tasks']

    def get_total(self, obj):
        return obj.tasks.count()

    def get_done(self, obj):
        return obj.tasks.filter(completed=True).count()


class PortalProjectSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    task_lists = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority',
            'start_date', 'due_date', 'progress', 'task_lists',
        ]

    def get_progress(self, obj):
        total = Task.objects.filter(task_list__project=obj).count()
        if not total:
            return 0
        done = Task.objects.filter(task_list__project=obj, completed=True).count()
        return round((done / total) * 100)

    def get_task_lists(self, obj):
        lists = obj.task_lists.prefetch_related('tasks').all()
        return PortalTaskListSerializer(lists, many=True).data


class PortalProjectListSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    open_invoices = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'status', 'priority', 'due_date', 'progress', 'open_invoices']

    def get_progress(self, obj):
        total = Task.objects.filter(task_list__project=obj).count()
        if not total:
            return 0
        done = Task.objects.filter(task_list__project=obj, completed=True).count()
        return round((done / total) * 100)

    def get_open_invoices(self, obj):
        return obj.invoices.exclude(
            status__in=['paid', 'cancelled']
        ).count()


class PortalMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = PortalMessage
        fields = ['id', 'body', 'sender_name', 'is_mine', 'created_at']
        read_only_fields = ['id', 'sender_name', 'is_mine', 'created_at']

    def get_sender_name(self, obj):
        u = obj.sender
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.email

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.sender_id == request.user.id


class PortalAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ['id', 'file_name', 'file_size', 'mime_type',
                  'uploaded_by_name', 'uploaded_at', 'file']
        read_only_fields = ['id', 'file_name', 'file_size', 'mime_type',
                            'uploaded_by_name', 'uploaded_at']

    def get_uploaded_by_name(self, obj):
        u = obj.uploaded_by
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.email


class PortalProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalProposal
        fields = [
            'id', 'title', 'content', 'status', 'client_note',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'title', 'content', 'created_at', 'updated_at']


class PortalInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'rate', 'amount']


class PortalInvoiceSerializer(serializers.ModelSerializer):
    items = PortalInvoiceItemSerializer(many=True, read_only=True)
    payment_methods = serializers.SerializerMethodField()
    payments_received = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'title', 'description',
            'subtotal', 'tax_rate', 'tax_amount', 'total_amount',
            'status', 'issue_date', 'due_date', 'paid_date',
            'items', 'payment_methods', 'payments_received',
        ]

    def get_payment_methods(self, obj):
        return [
            {'id': pm.id, 'display_name': pm.display_name, 'provider_type': pm.provider_type}
            for pm in obj.payment_methods.all()
        ]

    def get_payments_received(self, obj):
        return [
            {
                'id': p.id,
                'amount': p.amount,
                'payment_date': p.payment_date,
                'method': p.method,
                'notes': p.notes,
            }
            for p in obj.payments_received.all()
        ]


class PortalInvoiceListSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'title', 'total_amount',
            'status', 'due_date', 'issue_date', 'project_name',
        ]

    def get_project_name(self, obj):
        return obj.project.name if obj.project_id else None


# ─────────────────────────── project views ────────────────────────────────────

class PortalProjectView(ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsClientUser]

    def list(self, request):
        qs = Project.objects.filter(
            client__user_account=request.user
        ).exclude(status='cancelled').prefetch_related('task_lists__tasks', 'invoices')
        return Response(PortalProjectListSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        project = _owned_project(request.user, pk)
        return Response(PortalProjectSerializer(project).data)


# ─────────────────────────── messages ─────────────────────────────────────────

class PortalMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClientUser]

    def _project(self, user, project_pk):
        return _owned_project(user, project_pk)

    def get(self, request, project_pk):
        project = self._project(request.user, project_pk)
        messages = PortalMessage.objects.filter(project=project).select_related('sender')
        return Response(PortalMessageSerializer(messages, many=True, context={'request': request}).data)

    def post(self, request, project_pk):
        project = self._project(request.user, project_pk)
        body = request.data.get('body', '').strip()
        if not body:
            return Response({'detail': 'Message body is required.'}, status=status.HTTP_400_BAD_REQUEST)
        msg = PortalMessage.objects.create(project=project, sender=request.user, body=body)
        return Response(
            PortalMessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────── files ────────────────────────────────────────────

class PortalFileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClientUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _project(self, user, project_pk):
        return _owned_project(user, project_pk)

    def get(self, request, project_pk):
        project = self._project(request.user, project_pk)
        files = Attachment.objects.filter(project=project, task__isnull=True, client_visible=True).select_related('uploaded_by')
        return Response(PortalAttachmentSerializer(files, many=True).data)

    def post(self, request, project_pk):
        project = self._project(request.user, project_pk)
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        attachment = Attachment.objects.create(
            project=project,
            uploaded_by=request.user,
            file=uploaded,
            file_name=uploaded.name,
            file_size=uploaded.size,
            mime_type=uploaded.content_type or '',
        )
        return Response(PortalAttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)


# ─────────────────────────── proposals ────────────────────────────────────────

class PortalDashboardView(APIView):
    """
    Returns aggregate dashboard metrics for the authenticated client.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        projects = Project.objects.filter(client__user_account=request.user).exclude(status='COMPLETED')
        active_projects_count = projects.count()
        
        invoices = Invoice.objects.filter(project__client__user_account=request.user, status='SENT')
        outstanding_invoices_count = invoices.count()
        total_outstanding = sum(inv.amount for inv in invoices)
        
        unread_messages_count = PortalMessage.objects.filter(
            project__client__user_account=request.user
        ).exclude(sender=request.user).count()
        
        first_project = projects.first()
        freelancer_name = first_project.user.get_full_name() or first_project.user.email if first_project else "Your Freelancer"
        
        return Response({
            "active_projects": active_projects_count,
            "outstanding_invoices": outstanding_invoices_count,
            "total_outstanding": total_outstanding,
            "unread_messages": unread_messages_count,
            "freelancer_name": freelancer_name,
        })

class PortalProjectListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClientUser]

    def _project(self, user, project_pk):
        return _owned_project(user, project_pk)


class PortalProposalView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClientUser]

    def _project(self, user, project_pk):
        return _owned_project(user, project_pk)

    def get(self, request, project_pk):
        project = self._project(request.user, project_pk)
        proposals = PortalProposal.objects.filter(project=project)
        return Response(PortalProposalSerializer(proposals, many=True).data)


class PortalProposalActionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClientUser]

    def _get(self, user, project_pk, proposal_pk):
        project = _owned_project(user, project_pk)
        return get_object_or_404(PortalProposal, pk=proposal_pk, project=project)

    def post(self, request, project_pk, proposal_pk, action):
        proposal = self._get(request.user, project_pk, proposal_pk)
        note = request.data.get('note', '')

        if proposal.status != 'pending':
            return Response(
                {'detail': 'This proposal has already been actioned.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == 'approve':
            proposal.status = 'approved'
        elif action == 'reject':
            proposal.status = 'rejected'
        elif action == 'request_revision':
            if not note.strip():
                return Response({'detail': 'A note is required when requesting a revision.'}, status=status.HTTP_400_BAD_REQUEST)
            proposal.status = 'revision_requested'
        else:
            return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        proposal.client_note = note
        proposal.save(update_fields=['status', 'client_note', 'updated_at'])
        return Response(PortalProposalSerializer(proposal).data)


# ─────────────────────────── invoices ─────────────────────────────────────────

class PortalInvoiceView(ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsClientUser]

    def list(self, request):
        qs = Invoice.objects.filter(project__client__user_account=request.user).order_by('-created_at')
        return Response(PortalInvoiceListSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        invoice = get_object_or_404(Invoice, pk=pk, project__client__user_account=request.user)
        # auto-transition sent → viewed
        if invoice.status == Invoice.InvoiceStatus.SENT:
            invoice.status = Invoice.InvoiceStatus.VIEWED
            invoice.save(update_fields=['status'])
        return Response(PortalInvoiceSerializer(invoice).data)


# ─────────────────────────── freelancer-side: push proposal to portal ─────────

class PushProposalToPortalView(APIView):
    """
    Freelancer-only endpoint.
    POST /api/portal/push-proposal/
    Body: { project: <id>, ai_request: <id> (optional), title: "...", content: {...} }
    Creates or updates a PortalProposal so the client can review it.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if getattr(request.user, 'role', 'freelancer') != 'freelancer':
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        project_id = request.data.get('project')
        title = request.data.get('title', 'Proposal')
        content = request.data.get('content')
        ai_request_id = request.data.get('ai_request')

        if not project_id or not content:
            return Response({'detail': 'project and content are required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(Project, pk=project_id, user=request.user)

        proposal = PortalProposal.objects.create(
            project=project,
            title=title,
            content=content,
            ai_request_id=ai_request_id,
            created_by=request.user,
        )
        return Response(PortalProposalSerializer(proposal).data, status=status.HTTP_201_CREATED)


class FreelancerPortalMessageView(APIView):
    """
    Freelancer posts a message into a project's portal thread.
    POST /api/portal/projects/<project_pk>/freelancer-message/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_pk):
        if getattr(request.user, 'role', 'freelancer') != 'freelancer':
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        project = get_object_or_404(Project, pk=project_pk, user=request.user)
        body = request.data.get('body', '').strip()
        if not body:
            return Response({'detail': 'Message body is required.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = PortalMessage.objects.create(project=project, sender=request.user, body=body)
        return Response(
            PortalMessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PortalRequestView(APIView):
    """
    Client-facing endpoint to submit a new project request.
    POST /api/portal/requests/
    Body: message (text) and/or file (attachment)
    Scopes to the client's freelancer, runs extraction agent, and registers under freelancer.
    """
    permission_classes = [permissions.IsAuthenticated, IsClientUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        client = _client(request.user)
        freelancer = client.user
        
        file = request.FILES.get("file")
        text = request.data.get("message")
        
        if not file and not text:
            return Response(
                {"error": "Provide either a 'message' field or upload a 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from ai.services.ingestion import InputProcessor
        from ai.models import AIRequest, AIWorkflowTask
        from ai.agents.client_request_agent import ClientRequestAgent
        from ai.services.errors import ErrorType
        from .services import ActivityLoggingService

        request_id = uuid.uuid4().hex[:12]
        try:
            raw_text = InputProcessor.process(file=file, text=text)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"error": "Failed to read input. Please check your file and try again."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # Create request under the FREELANCER so it shows on their dashboard
        ai_request = AIRequest.objects.create(
            user=freelancer,
            raw_input=raw_text,
            status="pending",
        )

        workflow_task = AIWorkflowTask.objects.create(
            request=ai_request,
            task_type="extraction",
            status="processing"
        )

        agent = ClientRequestAgent()
        result = agent.extract(raw_text, request_id=request_id)

        # Log Activity
        ActivityLoggingService.log_activity(
            client=client,
            user=freelancer,
            activity_type="project_created",
            description=f"Client submitted a new project request via portal. AI extraction status: {ai_request.status}",
            metadata={"ai_request_id": ai_request.id}
        )

        if result.success:
            spec = result.data
            ai_request.parsed_output = spec.model_dump(mode="json")
            ai_request.status = "completed"
            ai_request.save(update_fields=["parsed_output", "status", "updated_at"])

            workflow_task.status = "completed"
            workflow_task.save(update_fields=["status"])

            return Response({
                "detail": "Project request submitted successfully and processed by AI.",
                "ai_request_id": ai_request.id,
                "project_type": spec.project_type
            }, status=status.HTTP_201_CREATED)

        error = result.error
        ai_request.status = "failed"
        ai_request.error_details = error.to_dict()
        ai_request.save(update_fields=["status", "error_details", "updated_at"])

        workflow_task.status = "failed"
        workflow_task.error_details = error.to_dict()
        workflow_task.save(update_fields=["status", "error_details"])

        if error.error_type == ErrorType.INPUT_ERROR:
            http_status = status.HTTP_400_BAD_REQUEST
        elif error.error_type == ErrorType.LLM_ERROR:
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE
        else:
            http_status = status.HTTP_422_UNPROCESSABLE_ENTITY

        return Response(error.to_response_dict(), status=http_status)

