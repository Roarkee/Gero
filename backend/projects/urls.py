from django.urls import path, include
from rest_framework.routers import DefaultRouter
from projects.views import (
    ProjectViewSet,
    TaskListViewSet,
    TaskViewSet,
    SubTaskViewSet,
    LabelViewSet,
)
from projects.time_tracking import TimeEntryViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasklists', TaskListViewSet, basename='tasklist')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'subtasks', SubTaskViewSet, basename='subtask')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'time-entries', TimeEntryViewSet, basename='timeentry')

urlpatterns = [
    path('', include(router.urls)),
]
