from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
import calendar
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from projects.models import Project, Task, TimeEntry, ProjectActivity
from invoices.models import Invoice, InvoicePayment
from expenses.models import Expense
from client.models import Client, ClientActivity

class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        today = now.date()

        # KPIs
        active_projects = Project.objects.filter(user=user, status='active').count()
        active_clients = Client.objects.filter(user=user, status='active').count()
        
        # Correctly calculate outstanding by subtracting amount_paid for sent, overdue, partly_paid
        outstanding_qs = Invoice.objects.filter(user=user, status__in=['sent', 'overdue', 'partly_paid'])
        outstanding_invoices = sum((inv.total_amount - (inv.amount_paid or Decimal('0.00'))) for inv in outstanding_qs) or Decimal('0.00')
        
        overdue_qs_all = Invoice.objects.filter(user=user, status='overdue')
        overdue_invoices_amt = sum((inv.total_amount - (inv.amount_paid or Decimal('0.00'))) for inv in overdue_qs_all) or Decimal('0.00')
        
        monthly_revenue = InvoicePayment.objects.filter(invoice__user=user, payment_date__year=today.year, payment_date__month=today.month).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        monthly_expenses = Expense.objects.filter(user=user, date__year=today.year, date__month=today.month).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        profit_this_month = monthly_revenue - monthly_expenses
        tracked_minutes = TimeEntry.objects.filter(user=user, start_time__year=today.year, start_time__month=today.month).aggregate(total=Sum('duration_minutes'))['total'] or 0
        hours_tracked_this_month = round(tracked_minutes / 60.0, 1)

        # Overdue Invoices
        overdue_invoices_qs = Invoice.objects.filter(user=user, status='overdue').order_by('due_date')[:5]
        overdue_invoices_list = [{
            'id': inv.id,
            'invoice_number': inv.invoice_number,
            'client_name': inv.client.name,
            'amount_due': str(inv.total_amount - (inv.amount_paid or Decimal('0.00'))),
            'days_overdue': (today - inv.due_date).days if inv.due_date else 0
        } for inv in overdue_invoices_qs]

        # Upcoming Deadlines (Projects)
        upcoming_projects_qs = Project.objects.filter(user=user, status='active', due_date__gte=now).order_by('due_date')[:5]
        upcoming_deadlines_list = [{
            'id': proj.id,
            'project_name': proj.name,
            'client_name': proj.client.name,
            'days_remaining': (proj.due_date.date() - today).days if proj.due_date else 0
        } for proj in upcoming_projects_qs]

        # Tasks Due Soon
        tasks_due_qs = Task.objects.filter(task_list__project__user=user, completed=False, due_date__gte=now).order_by('due_date')[:5]
        tasks_due_soon_list = [{
            'id': task.id,
            'task_title': task.title,
            'project_name': task.task_list.project.name,
            'project_id': task.task_list.project.id,
            'due_date': task.due_date.date() if task.due_date else None
        } for task in tasks_due_qs]

        # Clients Waiting
        clients_waiting_qs = Client.objects.filter(user=user, status='waiting_on_client').order_by('-updated_at')[:5]
        clients_waiting_list = [{
            'id': client.id,
            'client_name': client.name,
            'last_activity_date': client.updated_at.date()
        } for client in clients_waiting_qs]

        # Recent Activity (Merge Project & Client Activities)
        project_activities = list(ProjectActivity.objects.filter(user=user).order_by('-created_at')[:10])
        client_activities = list(ClientActivity.objects.filter(user=user).order_by('-created_at')[:10])
        
        all_activities = sorted(project_activities + client_activities, key=lambda x: x.created_at, reverse=True)[:10]
        recent_activity_list = []
        for act in all_activities:
            is_proj = isinstance(act, ProjectActivity)
            recent_activity_list.append({
                'id': f"{'proj' if is_proj else 'client'}_{act.id}",
                'type': act.activity_type,
                'description': act.description,
                'timestamp': act.created_at,
                'related_id': act.project.id if is_proj else act.client.id,
                'model': 'project' if is_proj else 'client'
            })

        # Financial Summary
        # Last 6 months revenue vs expenses
        six_months_ago = today.replace(day=1) - relativedelta(months=5)
        
        # Manually construct the last 6 months to ensure zeroes are included
        months_data = []
        for i in range(5, -1, -1):
            target_month = today.replace(day=1) - relativedelta(months=i)
            months_data.append({
                'year': target_month.year,
                'month': target_month.month,
                'month_name': calendar.month_abbr[target_month.month],
                'revenue': Decimal('0.00'),
                'expenses': Decimal('0.00')
            })

        # Revenue Data
        revenue_qs = InvoicePayment.objects.filter(
            invoice__user=user, 
            payment_date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('payment_date')
        ).values('month').annotate(total=Sum('amount'))
        
        for rev in revenue_qs:
            for m in months_data:
                if m['year'] == rev['month'].year and m['month'] == rev['month'].month:
                    m['revenue'] = rev['total'] or Decimal('0.00')

        # Expenses Data
        expenses_qs = Expense.objects.filter(
            user=user, 
            date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(total=Sum('amount'))

        for exp in expenses_qs:
            for m in months_data:
                if m['year'] == exp['month'].year and m['month'] == exp['month'].month:
                    m['expenses'] = exp['total'] or Decimal('0.00')

        # Outstanding Invoice Breakdown
        invoice_breakdown = Invoice.objects.filter(user=user).values('status').annotate(total=Sum('total_amount'))
        breakdown_dict = {
            'draft': Decimal('0.00'),
            'sent': Decimal('0.00'),
            'overdue': Decimal('0.00'),
            'paid': Decimal('0.00'),
            'partly_paid': Decimal('0.00'),
        }
        for item in invoice_breakdown:
            if item['status'] in breakdown_dict:
                breakdown_dict[item['status']] = item['total'] or Decimal('0.00')

        # Project Health
        project_health_qs = Project.objects.filter(user=user, status='active').select_related('insight')[:10]
        project_health_list = []
        for proj in project_health_qs:
            insight = getattr(proj, 'insight', None)
            progress = insight.completion_percentage if insight else 0
            budget_used = insight.budget_used_percentage if insight else 0
            logged_hours = insight.total_logged_hours if insight else 0
            
            project_health_list.append({
                'id': proj.id,
                'project_name': proj.name,
                'client_name': proj.client.name if proj.client else 'No Client',
                'progress_percentage': progress,
                'budget_used_percentage': budget_used,
                'hours_logged': str(logged_hours),
                'status': proj.status
            })

        return Response({
            'kpis': {
                'active_projects': active_projects,
                'active_clients': active_clients,
                'outstanding_invoice_amount': str(outstanding_invoices),
                'overdue_invoice_amount': str(overdue_invoices_amt),
                'monthly_revenue': str(monthly_revenue),
                'monthly_expenses': str(monthly_expenses),
                'profit_this_month': str(profit_this_month),
                'hours_tracked_this_month': hours_tracked_this_month
            },
            'overdue_invoices': overdue_invoices_list,
            'upcoming_deadlines': upcoming_deadlines_list,
            'tasks_due_soon': tasks_due_soon_list,
            'clients_waiting_on_response': clients_waiting_list,
            'recent_activity': recent_activity_list,
            'financial_summary': {
                'revenue_vs_expenses': months_data,
                'outstanding_invoice_breakdown': {k: str(v) for k, v in breakdown_dict.items()}
            },
            'project_health': project_health_list
        })
