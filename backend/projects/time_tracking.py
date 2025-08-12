from rest_framework import serializers, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import TimeEntry


class TimeEntrySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='task.task_list.project.name', read_only=True)
    
    class Meta:
        model = TimeEntry
        fields = '__all__'
        read_only_fields = ('user', 'duration_minutes')
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TimeEntry.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        task_id = request.data.get('task_id')
        description = request.data.get('description', '')
        
        # Stop any running timers
        TimeEntry.objects.filter(user=request.user, is_running=True).update(
            end_time=timezone.now(), is_running=False
        )
        
        # Start new timer
        time_entry = TimeEntry.objects.create(
            user=request.user,
            task_id=task_id,
            description=description,
            start_time=timezone.now(),
            is_running=True
        )
        
        serializer = self.get_serializer(time_entry)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def stop_timer(self, request, pk=None):
        time_entry = self.get_object()
        time_entry.end_time = timezone.now()
        time_entry.is_running = False
        time_entry.save()
        
        serializer = self.get_serializer(time_entry)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active_timer(self, request):
        active_timer = TimeEntry.objects.filter(
            user=request.user, is_running=True
        ).first()
        
        if active_timer:
            serializer = self.get_serializer(active_timer)
            return Response(serializer.data)
        return Response(None)