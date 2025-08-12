from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404

from projects.models import Project, Task, TaskList, Label, SubTask
from client.models import Client
from projects.serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
    TaskSerializer,
    TaskListSerializer,
    TaskListWithTasksSerializer,
    LabelSerializer,
    SubTaskSerializer,
    TaskWithSubTasksSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(client__user=self.request.user)

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
        return TaskList.objects.filter(project__client__user=self.request.user)
        
    

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
        return Task.objects.filter(task_list__project__client__user=self.request.user)

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
        return SubTask.objects.filter(task__project__client__user=self.request.user)


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Label.objects.filter(project__client__user=self.request.user)
