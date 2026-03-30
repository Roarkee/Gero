from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Expense, ExpenseCategory, Budget
from .serializers import ExpenseSerializer, ExpenseCategorySerializer, BudgetSerializer
from expenses.services import dashboard


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).select_related('category', 'project')
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
        res = dashboard(user)
        return Response(res)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ExpenseCategory.objects.filter(user=self.request.user).annotate(total_spent_annotated=Sum('expenses__amount'))


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related('category')