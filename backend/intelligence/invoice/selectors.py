from invoices.models import Invoice, InvoiceItem
from projects.models import Task,Project
from django.db.models import Sum, Count, Q, F
from django.contrib.auth import get_user


class InvoiceSelector:
    def __init__(self, *args, **kwargs):
    
        self.queryset = Invoice.objects.filter(user_id = 201 )

    def get_overdue_invoices(self):
        return self.queryset.filter(status = "overdue").count()
        
        