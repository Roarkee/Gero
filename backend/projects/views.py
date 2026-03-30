from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from django.utils import timezone
from rest_framework.filters import SearchFilter, OrderingFilter

from projects.models import Project, Task, TaskList, Label, SubTask, TimeEntry
from client.models import Client
from projects.serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
    TaskSerializer,
    TaskListSerializer,
    TaskListWithTasksSerializer,
    LabelSerializer,
    SubTaskSerializer,
    TaskWithSubTasksSerializer,
    TimeEntrySerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None # Disable pagination for dashboard/list logic
    filter_backends = [SearchFilter, OrderingFilter]

    def get_queryset(self):
        qs = self.queryset.filter(client__user=self.request.user).order_by('-created_at').select_related('client')
        if self.action == 'retrieve':
            qs = qs.prefetch_related(
                'task_lists__tasks__subtasks',
                'task_lists__tasks__labels',
                'task_lists__tasks__time_entries',
                'labels'
            )
        return qs

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return ProjectDetailSerializer
        return ProjectSerializer

    def perform_create(self, serializer):#this is making sure that the project belongs to a client that belongs 
        #to the authenticated user. 
        client_id = self.request.data.get('client')
        client=get_object_or_404(Client, id=client_id, user=self.request.user)
        serializer.save(client=client)


class TaskListViewSet(viewsets.ModelViewSet):
    queryset = TaskList.objects.all()
    serializer_class = TaskListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TaskList.objects.filter(project__client__user=self.request.user).select_related('project')
        if self.action in ['retrieve', 'with_tasks']:
            qs = qs.prefetch_related('tasks__subtasks', 'tasks__labels', 'tasks__time_entries')
        return qs
        
    

    @action(detail=True, methods=['get'])
    def with_tasks(self, request, pk=None):
        tasklist = self.get_object()
        serializer = TaskListWithTasksSerializer(tasklist)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.filter(task_list__project__client__user=self.request.user).select_related('task_list__project')
        if self.action in ['retrieve', 'with_subtasks'] or self.request.method in ['GET']:
            qs = qs.prefetch_related('subtasks', 'labels', 'time_entries')
        return qs

    @action(detail=True, methods=['get'])
    def with_subtasks(self, request, pk=None):
        task = self.get_object()
        serializer = TaskWithSubTasksSerializer(task)
        return Response(serializer.data)


class SubTaskViewSet(viewsets.ModelViewSet):
    queryset = SubTask.objects.all()
    serializer_class = SubTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubTask.objects.filter(task__project__client__user=self.request.user).select_related('task', 'label')


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Label.objects.filter(project__client__user=self.request.user).select_related('project')
    



class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TimeEntry.objects.filter(user=self.request.user).select_related('task__task_list__project')
    
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
