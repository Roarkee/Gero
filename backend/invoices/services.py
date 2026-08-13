from invoices.models import Invoice, InvoiceItem
from django.utils import timezone
from django.db.models import Sum
from django.db import transaction


class InvoiceService:

    @staticmethod
    def create_invoice(invoice_data, items):
        with transaction.atomic():
            invoice = Invoice.objects.create(**invoice_data)
            invoice_items = []
            for item in items:
                amount = item['rate'] * item['quantity']

                invoice_items.append(InvoiceItem(
                    invoice = invoice,
                    description = item['description'],
                    quantity = item['quantity'],
                    rate = item['rate'],
                    amount = amount

                ))
            created=InvoiceItem.objects.bulk_create(invoice_items)
            for created_item, item_data in zip(created, items):
                time_entries = item_data.get('time_entries')
                if time_entries:
                    created_item.time_entries.set(time_entries)

            invoice.save()
            return invoice            

       

    @staticmethod
    def invoice(user):
        user = user
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

        return {
                'total_revenue': total_revenue,
                'monthly_revenue': monthly_revenue,
                'unpaid_invoices': unpaid_invoices,
                'overdue_count': overdue_count,
            }

    @staticmethod
    def generate_pdf_for_invoice(invoice):
        import io
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import json

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
        
        # Payment Methods Section
        payment_providers = invoice.payment_provider.all()
        if payment_providers.exists():
            y -= 40
            p.setFont("Helvetica-Bold", 14)
            p.drawString(50, y, "Payment Options")
            
            p.setFont("Helvetica", 10)
            for pm in payment_providers:
                y -= 20
                if y < 50:  # Simple page break handling for payment options
                    p.showPage()
                    y = 750
                    p.setFont("Helvetica", 10)
                
                p.setFont("Helvetica-Bold", 10)
                p.drawString(50, y, pm.display_name)
                
                p.setFont("Helvetica", 10)
                try:
                    config = json.loads(pm.encrypted_config)
                    if pm.provider_type == 'mtn_momo':
                        y -= 15
                        p.drawString(50, y, f"Phone Number: {config.get('phone_number', '')}")
                        y -= 15
                        p.drawString(50, y, f"Account Name: {config.get('account_name', '')}")
                    elif pm.provider_type == 'bank':
                        y -= 15
                        p.drawString(50, y, f"Bank Name: {config.get('bank_name', '')}")
                        y -= 15
                        p.drawString(50, y, f"Account Number: {config.get('account_number', '')}")
                        y -= 15
                        p.drawString(50, y, f"Account Name: {config.get('account_name', '')}")
                    elif pm.provider_type == 'paystack':
                        y -= 15
                        p.drawString(50, y, f"Payment Link: {config.get('payment_link', '')}")
                except Exception:
                    pass
                y -= 10
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer
        