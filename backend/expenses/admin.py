from django.contrib import admin
from .models import Expense, ExpenseCategory, Budget


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['category', 'amount', 'period', 'start_date', 'end_date', 'spent_amount', 'is_over_budget']
    list_filter = ['period', 'start_date', 'end_date']
    readonly_fields = ['spent_amount', 'remaining_amount', 'is_over_budget']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'amount', 'date', 'project', 'created_at']
    list_filter = ['category', 'date', 'is_recurring']
    search_fields = ['title', 'description']