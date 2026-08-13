from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404


from .models import Client, ClientActivity
from .serializers import (
    ClientListSerializer, 
    ClientDetailSerializer, 
    ClientWriteSerializer,
    ClientActivitySerializer
)
from core.permissions import IsClientOwner
from .selectors import (
    get_dashboard_intelligence,
    get_full_client_intelligence,
    get_pipeline_intelligence,
    get_revenue_intelligence
)


class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsClientOwner]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'company_name']
    ordering_fields = ['created_at', 'name', 'health_score', 'last_activity_at']

    def get_queryset(self):
        return Client.objects.filter(user=self.request.user).order_by('name')

    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        elif self.action == 'retrieve':
            return ClientDetailSerializer
        return ClientWriteSerializer

    @action(detail=False, methods=['get'])
    def intelligence_dashboard(self, request):
        """Returns overall intelligence data for the user's clients."""
        data = get_dashboard_intelligence(request.user)
        return Response(data)

    @action(detail=True, methods=['get'])
    def intelligence(self, request, pk=None):
        """Returns full intelligence metrics for a specific client."""
        client = self.get_object()
        data = get_full_client_intelligence(client)
        return Response(data)

    @action(detail=True, methods=['get', 'post'])
    def activities(self, request, pk=None):
        """Returns or creates the activity stream for a specific client."""
        client = self.get_object()

        if request.method == 'POST':
            from .services import ActivityLoggingService
            activity_type = request.data.get('activity_type')
            description = request.data.get('description')
            metadata = request.data.get('metadata', {})
            
            if not activity_type or not description:
                return Response({'error': 'activity_type and description are required'}, status=status.HTTP_400_BAD_REQUEST)
                
            activity = ActivityLoggingService.log_activity(
                client=client,
                user=request.user,
                activity_type=activity_type,
                description=description,
                metadata=metadata
            )
            serializer = ClientActivitySerializer(activity)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        activities = ClientActivity.objects.filter(client=client).order_by('-created_at')
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = ClientActivitySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ClientActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def schedule_followup(self, request, pk=None):
        """Schedules a follow-up and logs the specific activity."""
        from .services import ActivityLoggingService
        from rest_framework import status
        from django.utils.dateparse import parse_datetime
        
        client = self.get_object()
        next_followup_at = request.data.get('next_followup_at')
        followup_type = request.data.get('type', 'follow_up_scheduled')
        note = request.data.get('note', '')

        if not next_followup_at:
            return Response({'error': 'next_followup_at is required'}, status=status.HTTP_400_BAD_REQUEST)

        dt = parse_datetime(next_followup_at)

        if dt is None:
            return Response({"error": "Invalid datetime format"},
                status=status.HTTP_400_BAD_REQUEST)
        # Update client
        client.next_followup_at = dt
        client.save(update_fields=['next_followup_at'])

        # Log Activity
        ActivityLoggingService.log_activity(
            client=client,
            user=request.user,
            activity_type=followup_type,
            description=f"Scheduled follow-up for {next_followup_at}",
            metadata={'note': note} if note else {}
        )

        return Response({'status': 'success', 'next_followup_at': next_followup_at})

    @action(detail=True, methods=['post'])
    def invite_client(self, request, pk=None):
        """Sends an invitation email to the client to join the portal."""
        from django.contrib.auth import get_user_model
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from django.core.mail import send_mail
        from django.conf import settings

        User = get_user_model()
        client = self.get_object()

        # Create user account if it doesn't exist
        user, created = User.objects.get_or_create(
            email=client.email,
            defaults={
                'first_name': client.name.split()[0] if client.name else '',
                'last_name': ' '.join(client.name.split()[1:]) if len(client.name.split()) > 1 else '',
                'is_client': True,
                'is_freelancer': False, # Just in case they are entirely new
            }
        )

        if created:
            user.set_unusable_password()
            user.save()
        else:
            # Existing user - ensure they get client capabilities without removing freelancer ones
            if not user.is_client:
                user.is_client = True
                user.save(update_fields=['is_client'])

        # Link client to user account
        if not client.user_account:
            client.user_account = user
            client.save(update_fields=['user_account'])

        # Generate explicit invitation record
        from django.utils import timezone
        import datetime
        from client.models import ClientInvitation
        
        # Expire any existing pending invites for this client
        ClientInvitation.objects.filter(client=client, is_accepted=False).update(expires_at=timezone.now())

        invitation = ClientInvitation.objects.create(
            client=client,
            email=client.email,
            expires_at=timezone.now() + datetime.timedelta(days=3)
        )

        invite_url = f"{settings.FRONTEND_URL}/portal/accept-invite?token={invitation.token}"

        send_mail(
            subject="You've been invited to Gero",
            message=(
                f"Hi {client.name},\n\n"
                f"You've been invited to access your client portal on Gero.\n\n"
                f"Click the link below to set your password and get started:\n{invite_url}\n\n"
                f"This link expires after 3 days.\n\nThe Gero Team"
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[client.email],
            fail_silently=False,
        )

        return Response({'detail': f'Invitation sent to {client.email}.'})
