from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceListSerializer, InvoiceItemSerializer
from invoices.services import InvoiceService

class InvoiceViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # return Invoice.objects.all()
        return Invoice.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
        res = InvoiceService.invoice(user)
       
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
        for te in time_entries:
            hours = te.duration_minutes / 60
            amount = hours * te.hourly_rate

            item = InvoiceItem.objects.create(
                invoice=invoice,
                description=f"{te.task.title} ({hours:.2f} hrs)",
                quantity=hours,
                rate=te.hourly_rate,
            )
            item.time_entries.add(te)

            te.invoice = invoice
            te.save(update_fields=['invoice'])

            items.append(item)

        return Response({"message": f"{len(items)} items added"})

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        from django.http import HttpResponse
        import io
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter

        invoice = self.get_object()
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        p.setFont("Helvetica-Bold", 20)
        p.drawString(50, 750, f"INVOICE {invoice.invoice_number}")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, 720, f"Client: {invoice.client.name if invoice.client else 'N/A'}")
        p.drawString(50, 700, f"Issue Date: {invoice.issue_date}")
        p.drawString(50, 680, f"Due Date: {invoice.due_date}")
        
        y = 630
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Description")
        p.drawString(300, y, "Qty")
        p.drawString(400, y, "Rate")
        p.drawString(500, y, "Amount")
        
        y -= 20
        p.setFont("Helvetica", 10)
        for item in invoice.items.all():
            p.drawString(50, y, str(item.description)[:40])
            p.drawString(300, y, str(item.quantity))
            p.drawString(400, y, f"${item.rate}")
            p.drawString(500, y, f"${item.amount}")
            y -= 20
            
        y -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(400, y, "Subtotal:")
        p.drawString(500, y, f"${invoice.subtotal}")
        y -= 20
        p.drawString(400, y, f"Tax ({invoice.tax_rate}%):")
        p.drawString(500, y, f"${invoice.tax_amount}")
        y -= 20
        p.drawString(400, y, "Total:")
        p.drawString(500, y, f"${invoice.total_amount}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Invoice_{invoice.invoice_number}.pdf"'
        return response


class InvoiceItemViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceItemSerializer
    # permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # return InvoiceItem.objects.all()
        return InvoiceItem.objects.filter(invoice__user=self.request.user)


# class PaymentViewSet(viewsets.ModelViewSet):
#     serializer_class = PaymentSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
    # def get_queryset(self):
    #     return Payment.objects.filter(invoice__user=self.request.user)