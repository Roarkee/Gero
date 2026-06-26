from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ai.views import ClientRequestViewSet

router = DefaultRouter()
router.register(r"ai-requests", ClientRequestViewSet, basename="ai-requests")

urlpatterns = [
    path("", include(router.urls)),
]