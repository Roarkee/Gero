from invoices.models import Invoice
from django.utils import timezone
from django.db.models import Sum

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
    