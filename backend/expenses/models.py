from django.db import models
from django.conf import settings
from projects.models import Project
from decimal import Decimal
from django.core.exceptions import ValidationError
from calendar import monthrange
from datetime import timedelta


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
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name='budgets')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly','Weekly'),
        ('fortnightly', 'Fortnightly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
        ('custom', 'Custom'),
    ], default='monthly')
    
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'category', 'start_date', 'end_date']

    def clean(self):
        if self.category.user != self.user:
            raise ValidationError("category of user doesn't match budget user")

        if self.start_date > self.end_date:
            raise ValidationError("Start date cannot be after end date.")

        duration = (self.end_date - self.start_date).days + 1

        if self.period == 'weekly':
            if duration != 7:
                raise ValidationError(
                    "Weekly budgets must span exactly 7 days."
                )

        elif self.period == 'fortnightly':
            if duration != 14:
                raise ValidationError(
                    "Fortnightly budgets must span exactly 14 days."
                )

        elif self.period == 'monthly':
            last_day = monthrange(
                self.start_date.year,
                self.start_date.month
            )[1]

            if (
                self.start_date.day != 1 or
                self.end_date.day != last_day or
                self.start_date.month != self.end_date.month or
                self.start_date.year != self.end_date.year
            ):
                raise ValidationError(
                    "Monthly budgets must cover exactly one calendar month."
                )
            
        elif self.period == 'quarterly':

            if self.start_date.day != 1:
                raise ValidationError(
                    "Quarterly budgets must start on first day of quarter."
                )

            quarter_months = [1, 4, 7, 10]

            if self.start_date.month not in quarter_months:
                raise ValidationError(
                    "Quarterly budgets must begin at start of quarter."
                )

            expected_end_month = self.start_date.month + 2

            last_day = monthrange(
                self.start_date.year,
                expected_end_month
            )[1]

            if (
                self.end_date.month != expected_end_month or
                self.end_date.day != last_day
            ):
                raise ValidationError(
                    "Quarterly budgets must span exactly one quarter."
                )
            
        elif self.period == 'yearly':

            if (
                self.start_date.month != 1 or
                self.start_date.day != 1 or
                self.end_date.month != 12 or
                self.end_date.day != 31 or
                self.start_date.year != self.end_date.year
            ):
                raise ValidationError(
                    "Yearly budgets must cover an entire calendar year."
                )
    

        elif self.period == 'custom':
            pass
    
    def __str__(self):
        return f"{self.category.name} Budget - {self.amount}"
    
    @property
    def spent_amount(self):
        return self.category.expenses.filter(
            user = self.user,
            category = self.category,
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
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name='expenses')
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

    def clean(self):
        if self.category.user != self.user:
            raise ValidationError("category of user doesn't match budget user")
        if self.project and self.project.user != self.user:
            raise ValidationError("user must belong to same project")
    
    def __str__(self):
        return f"{self.title} - ${self.amount}"