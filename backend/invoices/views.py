from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceListSerializer, InvoiceItemSerializer
from invoices.services import invoice
from projects.models import TimeEntry
from django.db import transaction

class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = Invoice.objects.filter(user=self.request.user).select_related('client', 'project')
        if self.action in ['retrieve', 'list']:
            qs = qs.prefetch_related('items')
        return qs
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
        res = invoice(user)
       
        return Response(res)
    
    @action(detail=True, methods=['post'])
    def generate_from_time(self, request, pk=None):
        invoice = self.get_object()

        time_entries = TimeEntry.objects.filter(
            user=request.user,
            project=invoice.project,
            invoice__isnull=True,
            is_billable=True
        )

        items = []
        with transaction.atomic():
            for te in time_entries:
                hours = te.duration_minutes / 60.0
                amount = hours * float(te.hourly_rate) if te.hourly_rate else 0

                item = InvoiceItem.objects.create(
                    invoice=invoice,
                    description=f"{te.task.title} ({hours:.2f} hrs)",
                    quantity=hours,
                    rate=te.hourly_rate or 0,
                )
                item.time_entries.add(te)

                te.invoice = invoice
                te.save(update_fields=['invoice'])

                items.append(item)

        return Response({"message": f"{len(items)} items added"})


class InvoiceItemViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return InvoiceItem.objects.filter(invoice__user=self.request.user)


# class PaymentViewSet(viewsets.ModelViewSet):
#     serializer_class = PaymentSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
    # def get_queryset(self):
    #     return Payment.objects.filter(invoice__user=self.request.user)