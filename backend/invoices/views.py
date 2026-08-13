from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, InvoiceItem, InvoicePayment
from .serializers import InvoiceSerializer, InvoiceListSerializer, InvoiceItemSerializer, InvoicePaymentSerializer
from invoices.services import InvoiceService
from django.core.mail import EmailMessage


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
        res = InvoiceService.invoice(request.user)
        return Response(res)

    @action(detail=True, methods=['post'])
    def generate_from_time(self, request, pk=None):
        from projects.models import TimeEntry
        invoice = self.get_object()
        time_entries = TimeEntry.objects.filter(
            user=request.user,
            project=invoice.project,
            invoice__isnull=True,
            is_billable=True,
        )
        items = []
        for te in time_entries:
            hours = te.duration_minutes / 60
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
        invoice = self.get_object()
        buffer = InvoiceService.generate_pdf_for_invoice(invoice)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Invoice_{invoice.invoice_number}.pdf"'
        return response

    def _send_email(self, invoice, subject, body):
        buffer = InvoiceService.generate_pdf_for_invoice(invoice)
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email='no-reply@gero.com',
            to=[invoice.client.email],
        )
        email.attach(f'Invoice_{invoice.invoice_number}.pdf', buffer.getvalue(), 'application/pdf')
        email.send(fail_silently=False)

    @action(detail=True, methods=['post'])
    def send_invoice(self, request, pk=None):
        invoice = self.get_object()
        if not invoice.client.email:
            return Response({"detail": "Client email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from django.conf import settings
            link = f"{settings.FRONTEND_URL}/invoice/{invoice.id}"
            self._send_email(invoice,
                             subject=f'Invoice {invoice.invoice_number} from Gero',
                             body=f'Please find attached your invoice {invoice.invoice_number}.\n\nYou can view and pay your invoice securely online at:\n{link}')
            if invoice.status == Invoice.InvoiceStatus.DRAFT:
                invoice.status = Invoice.InvoiceStatus.SENT
                invoice.save(update_fields=['status'])
            return Response({"detail": "Invoice sent successfully."})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def resend_invoice(self, request, pk=None):
        invoice = self.get_object()
        resendable = {
            Invoice.InvoiceStatus.SENT,
            Invoice.InvoiceStatus.OVERDUE,
        }
        if invoice.status not in resendable:
            return Response({"detail": "Invoice cannot be resent in its current state."},
                            status=status.HTTP_400_BAD_REQUEST)
        if not invoice.client.email:
            return Response({"detail": "Client email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from django.conf import settings
            link = f"{settings.FRONTEND_URL}/invoice/{invoice.id}"
            self._send_email(invoice,
                             subject=f'Invoice {invoice.invoice_number} from Gero (Reminder)',
                             body=f'This is a reminder for invoice {invoice.invoice_number}.\n\nYou can view and pay your invoice securely online at:\n{link}')
            return Response({"detail": "Invoice resent successfully."})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel_invoice(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.InvoiceStatus.CANCELLED:
            return Response({"detail": "Invoice is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = Invoice.InvoiceStatus.CANCELLED
        invoice.save(update_fields=['status'])
        return Response({"detail": "Invoice cancelled.", "status": invoice.status})

    @action(detail=True, methods=['post'])
    def duplicate_invoice(self, request, pk=None):
        from django.utils import timezone
        invoice = self.get_object()
        next_seq = Invoice.objects.filter(user=invoice.user).count() + 1
        today = timezone.now().date()
        if invoice.due_date and invoice.issue_date:
            days_diff = max((invoice.due_date - invoice.issue_date).days, 14)
        else:
            days_diff = 14
        new_due_date = today + timezone.timedelta(days=days_diff)

        new_invoice = Invoice.objects.create(
            user=invoice.user,
            client=invoice.client,
            project=invoice.project,
            sequence_number=next_seq,
            title=f"Copy of {invoice.title}",
            description=invoice.description,
            tax_rate=invoice.tax_rate,
            issue_date=today,
            due_date=new_due_date,
            status=Invoice.InvoiceStatus.DRAFT,
        )
        for item in invoice.items.all():
            InvoiceItem.objects.create(
                invoice=new_invoice,
                description=item.description,
                quantity=item.quantity,
                rate=item.rate,
                amount=item.amount,
            )
        new_invoice.recalculate_totals()
        new_invoice.save()
        return Response({"detail": "Invoice duplicated.", "id": new_invoice.id})


class InvoiceItemViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InvoiceItem.objects.filter(invoice__user=self.request.user)


class InvoicePaymentViewSet(viewsets.ModelViewSet):
    serializer_class = InvoicePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InvoicePayment.objects.filter(invoice__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()

class PublicInvoiceView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk=None):
        from django.shortcuts import get_object_or_404
        invoice = get_object_or_404(Invoice, pk=pk)
        
        # We want to return safe public data.
        # We can just serialize it using InvoiceSerializer
        serializer = InvoiceSerializer(invoice)
        data = serializer.data
        
        # Include freelancer info safely
        data['freelancer'] = {
            'name': invoice.user.get_full_name() or invoice.user.email,
            'email': invoice.user.email
        }
        
        return Response(data)
