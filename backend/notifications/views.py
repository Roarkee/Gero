from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        return Response(
            {"response": "Why do you want to create your own notifications ei"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(
            is_read=True, 
            read_at=timezone.now()
        )
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_notifications_number(self, request):
        unread_notifications_count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_notifications': unread_notifications_count})

    