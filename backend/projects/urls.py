from django.urls import path, include
from rest_framework.routers import DefaultRouter
from projects.views import (
    ProjectViewSet,
    TaskListViewSet,
    TaskViewSet,
    SubTaskViewSet,
    LabelViewSet,
    ProjectActivityViewSet,
    AttachmentViewSet,
    RecurringTaskViewSet,
)
from projects.views import TimeEntryViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasklists', TaskListViewSet, basename='tasklist')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'subtasks', SubTaskViewSet, basename='subtask')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'time-entries', TimeEntryViewSet, basename='timeentry')
router.register(r'activities', ProjectActivityViewSet, basename='activity')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'recurring-tasks', RecurringTaskViewSet, basename='recurringtask')
urlpatterns = [
    path('', include(router.urls)),
]
