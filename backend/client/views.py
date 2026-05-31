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
from .permissions import IsClientOwner
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
        return Client.objects.all()

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

    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Returns the activity stream for a specific client."""
        client = self.get_object()
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
        
        client = self.get_object()
        next_followup_at = request.data.get('next_followup_at')
        followup_type = request.data.get('type', 'follow_up_scheduled')
        note = request.data.get('note', '')

        if not next_followup_at:
            return Response({'error': 'next_followup_at is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Update client
        client.next_followup_at = next_followup_at
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
