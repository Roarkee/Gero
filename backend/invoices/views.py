from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceListSerializer, InvoiceItemSerializer, PaymentSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
        today = timezone.now().date()
        
        # Revenue stats
        total_revenue = Invoice.objects.filter(
            user=user, status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # This month's revenue
        month_start = today.replace(day=1)
        monthly_revenue = Invoice.objects.filter(
            user=user, status='paid', paid_date__gte=month_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Unpaid invoices
        unpaid_invoices = Invoice.objects.filter(
            user=user, status__in=['sent', 'overdue']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Overdue invoices count
        overdue_count = Invoice.objects.filter(
            user=user, status='overdue'
        ).count()
        
        return Response({
            'total_revenue': total_revenue,
            'monthly_revenue': monthly_revenue,
            'unpaid_invoices': unpaid_invoices,
            'overdue_count': overdue_count,
        })


class InvoiceItemViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return InvoiceItem.objects.filter(invoice__user=self.request.user)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # def get_queryset(self):
    #     return Payment.objects.filter(invoice__user=self.request.user)