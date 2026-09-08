from invoices.models import Invoice, InvoiceItem
from projects.models import Task,Project
from django.db.models import Sum, Count, Q, F, Avg,ExpressionWrapper,IntegerField,FloatField
from django.db.models.functions import TruncMonth,Round,Extract
from django.contrib.auth import get_user


# this should give data to answer basically how our billing is working
# and how efficiently we convert work to cash

class InvoiceSelector:
    def __init__(self,user, *args, **kwargs):
        self.user = user    
        self.queryset = Invoice.objects.filter(user = self.user )
    # this is the number of invoices overdue 
    
    def get_overdue_invoices(self):
        qs = self.queryset.filter(status = "overdue")
        total_amount = qs.aggregate(t=Sum('total_amount'))['t']


        return {"invoices": qs,
                "count": qs.count(),
                "total_amount":total_amount
                }
    
    # lists the invoices paid, the number and the total amount
    def get_paid_invoices(self):
        qs = self.queryset.filter(status = "paid")
        total_amount = qs.aggregate(t = Sum('total_amount'))['t'] 

        return {"invoices": list(qs),
                "count": qs.count(),
                "total_amount": total_amount}
    
    # lists the invoices that have been sent
    def get_sent_invoices(self):
        qs = self.queryset.filter(status = "sent")
        total_amount = qs.aggregate(total = Sum('total_amount'))['total']

        return {"invoices": list(qs),
                "count": qs.count(),
                "total_amount": total_amount}
        
    # this calculates the revenue the lancer made each month
    def get_monthly_revenue(self):
        rev = (self.queryset.annotate(month = TruncMonth('paid_date'))
               .values('month')
               .annotate(amount = Sum('total_amount'))
               .order_by('month')
               )
        return rev
    
    # the average amount of money per invoice
    def get_avg_invoice_size(self):
        return self.queryset.aggregate(average = Round(Avg('total_amount'),3))
    
    # calculates the time it takes for the lancer to receive payment of an invoice
    def get_invoice_payment_time(self):
        return (
        Invoice.objects.filter(
            status='paid',
            paid_date__isnull=False
        )
        .annotate(
            days_to_pay=ExpressionWrapper(
                    Extract(
                        F('paid_date') - F('issue_date'),
                        'epoch'
                    ) / 86400.0,
                    output_field=FloatField()
                )
        )
        .values(
            'client__name',
            'project__name',
            'days_to_pay'
        ).order_by('days_to_pay')
    )

    # this gets the time on average it takes for a client to pay
    def get_client_payment_behavior(self):

        return (
            Invoice.objects.filter(
                status='paid',
                paid_date__isnull=False
            )
            .annotate(
                days_to_pay=ExpressionWrapper(
                    Extract(
                        F('paid_date') - F('issue_date'),
                        'epoch'
                    ) / 86400.0,
                    output_field=FloatField()
                )
            )
            .values(
                'client_id',
                'client__name',
            )
            .annotate(
                total_invoices=Count('id'),

                average_payment_days=Avg('days_to_pay'),

                late_payments=Count(
                    'id',
                    filter=Q(
                        paid_date__gt=F('due_date')
                    )
                ),

                overdue_ratio=ExpressionWrapper(
                    Count(
                        'id',
                        filter=Q(
                            paid_date__gt=F('due_date')
                        )
                    ) * 100.0 / Count('id'),
                    output_field=FloatField()
                )
            )
            .order_by('-average_payment_days')
        )

    # across all invoices how long does it take to collect payment?
    def get_average_collection_cycle(self):

        return (
            self.queryset.filter(
                status='paid',
                paid_date__isnull=False
            )
            .annotate(
                payment_days=ExpressionWrapper(
                    Extract(
                        F('paid_date') - F('issue_date'),
                        'epoch'
                    ) / 86400.0,
                    output_field=FloatField()
                )
            )
            .aggregate(
                average_cycle=Avg('payment_days')
            )
        )

    # the clients bringing in most revenue
    def get_top_clients_by_revenue(self):
        return (self.queryset.filter(status = 'paid')
              .values('client_id', 'client__name')
              .annotate( total = Sum('total_amount'))
              ).order_by('-total')


    def get_aging_receivables(self):
        pass

    def get_overdue_percentage(self):
        """
        Returns the percentage of non-draft/cancelled invoices that are overdue.
        """
        total = self.queryset.filter(
            status__in=['sent', 'overdue', 'paid']
        ).count()

        overdue = self.queryset.filter(
            status='overdue'
        ).count()

        if total == 0:
            return 0.0

        return round((overdue / total) * 100, 2)

    def get_overdue_invoice_aging(self):
        """
        Returns overdue invoices annotated with days_overdue and amount
        for use by AgingReceivablesCalculator.
        """
        from django.utils import timezone

        today = timezone.now().date()

        invoices = (
            self.queryset
            .filter(status='overdue')
            .values('id', 'due_date', 'total_amount')
        )

        result = []
        for inv in invoices:
            days_overdue = (today - inv['due_date']).days
            result.append({
                'days_overdue': max(days_overdue, 0),
                'amount': float(inv['total_amount']),
            })

        return result

    




'''2. Collection Intelligence

Questions:

How long do clients take to pay?
Which invoices are at risk?
Which clients consistently pay late?
What % of invoices become overdue?
Average collection cycle?

VERY important for freelancers.

3. Invoice Efficiency Intelligence

Questions:

Are invoices being sent quickly enough?
Are projects being billed late?
Are billable hours slipping through?
Are time entries not attached to invoices?
Are invoices too small/frequent?

This becomes operational intelligence.

4. Cash Flow Intelligence

Questions:

Expected incoming cash?
Upcoming due payments?
Forecasted revenue?
Outstanding receivables?
Aging invoices?

5. Billing Intelligence
Questions:
Which services generate most revenue?
Which invoice items are most common?
Hourly vs fixed-price performance?
Tax collected?
Revenue per project/client?

6. Risk Intelligence
Questions:
Which invoices are likely to become overdue?
Which clients are financially risky?
Which projects have high unpaid balances?
Revenue concentration risk?'''