from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ai.views import ClientRequestViewSet, ScopeAnalysisView, PricingView, ProposalView, ProjectGenerationView

router = DefaultRouter()
router.register(r"ai-requests", ClientRequestViewSet, basename="ai-requests")

urlpatterns = [
    path("", include(router.urls)),
    path("scope-analysis/", ScopeAnalysisView.as_view(), name="scope-analysis"),
    path("pricing/", PricingView.as_view(), name="pricing"),
    path("proposal/", ProposalView.as_view(), name="proposal"),
    path("project-plan/", ProjectGenerationView.as_view(), name="project-plan"),
]
