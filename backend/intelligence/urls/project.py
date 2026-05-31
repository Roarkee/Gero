from django.urls import path

from intelligence.views.project import (
    ProjectOverviewAPIView,
    ProjectProfitabilityAPIView,
    ProjectProductivityAPIView,
    ProjectDeliveryAPIView,
    ProjectBudgetAPIView,
    ProjectHealthAPIView
)

urlpatterns = [
    path(
        "<int:project_id>/overview/",
        ProjectOverviewAPIView.as_view()
    ),

    path(
        "<int:project_id>/profitability/",
        ProjectProfitabilityAPIView.as_view()
    ),

    path(
        "<int:project_id>/productivity/",
        ProjectProductivityAPIView.as_view()
    ),

    path(
        "<int:project_id>/delivery/",
        ProjectDeliveryAPIView.as_view()
    ),

    path(
        "<int:project_id>/budget/",
        ProjectBudgetAPIView.as_view()
    ),

    path(
        "<int:project_id>/health/",
        ProjectHealthAPIView.as_view()
    ),
]