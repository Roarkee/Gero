from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from projects.models import Project
from intelligence.project.services import *


class ProjectOwnershipMixin:

    def get_project(self, project_id):

        return get_object_or_404(
            Project,
            id=project_id,
            client__user=self.request.user
        )
    

class ProjectProfitabilityAPIView(
    ProjectOwnershipMixin,
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):

        self.get_project(project_id)

        data = (
            ProjectProfitabilityService
            .get_project_profitability(project_id)
        )

        return Response(data)
    



class ProjectProductivityAPIView(
    ProjectOwnershipMixin,
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):

        self.get_project(project_id)

        data = (
            ProjectProductivityService
            .get_project_productivity(project_id)
        )

        return Response(data)
    



class ProjectDeliveryAPIView(
    ProjectOwnershipMixin,
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):

        self.get_project(project_id)

        data = (
            ProjectDeliveryService
            .get_delivery_metrics(project_id)
        )

        return Response(data)
    




class ProjectBudgetAPIView(
    ProjectOwnershipMixin,
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):

        self.get_project(project_id)

        data = (
            ProjectBudgetService
            .get_budget_status(project_id)
        )

        return Response(data)
    

class ProjectHealthAPIView(
    ProjectOwnershipMixin,
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):

        self.get_project(project_id)

        data = (
            ProjectHealthService
            .get_project_health(project_id)
        )

        return Response(data)
    


class ProjectOverviewAPIView(
    ProjectOwnershipMixin,
    APIView
):

    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):

        self.get_project(project_id)

        data = (
            ProjectOverviewService
            .get_project_overview(project_id)
        )

        return Response(data)


