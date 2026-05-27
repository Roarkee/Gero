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
        