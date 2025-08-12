from django.db import models
from django.conf import settings
from projects.models import Project
from decimal import Decimal


class ExpenseCategory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color for charts
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
        verbose_name_plural = 'Expense Categories'
    
    def __str__(self):
        return self.name


class Budget(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='budgets')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=20, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ], default='monthly')
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'category', 'start_date', 'end_date']
    
    def __str__(self):
        return f"{self.category.name} Budget - {self.amount}"
    
    @property
    def spent_amount(self):
        return self.category.expenses.filter(
            date__gte=self.start_date,
            date__lte=self.end_date
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
    
    @property
    def remaining_amount(self):
        return self.amount - self.spent_amount
    
    @property
    def is_over_budget(self):
        return self.spent_amount > self.amount


class Expense(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='expenses')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    
    receipt_url = models.URLField(blank=True)  # For storing receipt images/documents
    is_recurring = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.title} - ${self.amount}"