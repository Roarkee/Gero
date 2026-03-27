from expenses.models import Expense
from django.utils import timezone
from django.db.models import Sum
from  datetime import timedelta
    
def dashboard(user):
    user = user            
    today = timezone.now().date()
    month_start = today.replace(day=1)
    
    # Total expenses this month
    monthly_expenses = Expense.objects.filter(
        user=user, date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Expenses by category for charts
    category_expenses = Expense.objects.filter(
        user=user, date__gte=month_start
    ).values('category__name', 'category__color').annotate(
        total=Sum('amount')
    ).order_by('-total')
    
    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(6):
        month_date = (today.replace(day=1) - timedelta(days=32*i)).replace(day=1)
        next_month = (month_date.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        month_total = Expense.objects.filter(
            user=user, 
            date__gte=month_date,
            date__lt=next_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        monthly_trend.append({
            'month': month_date.strftime('%b %Y'),
            'total': float(month_total)
        })

    return {
            'monthly_expenses': monthly_expenses,
            'category_expenses': list(category_expenses),
            'monthly_trend': list(reversed(monthly_trend))
        }