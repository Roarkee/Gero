from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Expense, ExpenseCategory, Budget
from .serializers import ExpenseSerializer, ExpenseCategorySerializer, BudgetSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
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
        
        return Response({
            'monthly_expenses': monthly_expenses,
            'category_expenses': list(category_expenses),
            'monthly_trend': list(reversed(monthly_trend))
        })


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ExpenseCategory.objects.filter(user=self.request.user)


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)