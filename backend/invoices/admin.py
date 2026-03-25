from django.contrib import admin
from .models import Invoice, InvoiceItem



@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client', 'total_amount', 'status', 'due_date', 'created_at']
    list_filter = ['status', 'created_at', 'due_date']
    search_fields = ['invoice_number', 'client__name', 'title']
    readonly_fields = ['subtotal', 'tax_amount', 'total_amount']


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'description', 'quantity', 'rate', 'amount']

