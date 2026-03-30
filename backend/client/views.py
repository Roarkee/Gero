from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    pagination_class = None


    def get_queryset(self):
        from django.db.models import Sum, Q, Count, DecimalField
        from django.db.models.functions import Coalesce
        # Only show the freelancer's own clients
        return Client.objects.filter(user=self.request.user).annotate(
            total_revenue=Coalesce(
                Sum('invoices__total_amount', filter=Q(invoices__status='paid')), 
                0.0, output_field=DecimalField()
            ),
            unpaid_invoices_total=Coalesce(
                Sum('invoices__total_amount', filter=Q(invoices__status__in=['sent', 'overdue'])), 
                0.0, output_field=DecimalField()
            ),
            active_projects_count=Count('projects', filter=Q(projects__status='active'), distinct=True)
        ).order_by('-created_at')

    serializer_class = ClientSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        client = self.get_object()
        
        revenue = client.invoices.filter(status='paid').aggregate(total=Sum('total_amount'))['total'] or 0
        unpaid_invoices = client.invoices.filter(status__in=['sent', 'overdue']).aggregate(total=Sum('total_amount'))['total'] or 0
        active_projects = client.projects.filter(status='active').count()
        
        return Response({
            'total_revenue': revenue,
            'unpaid_invoices_total': unpaid_invoices,
            'active_projects_count': active_projects
        })