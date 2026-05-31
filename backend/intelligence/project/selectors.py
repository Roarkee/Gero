# this would be for queries only

from django.db.models import Sum,Count,Q,F, ExpressionWrapper,DecimalField, Avg
from invoices.models import Invoice
from projects.models import Project, ProjectInsight,ProjectActivity, Task, TimeEntry
from decimal import Decimal
from expenses.models import Expense
from datetime import timedelta
from django.utils import timezone

class ProjectSelectors:
    @staticmethod
    def get_paid_revenue(project_id):

        return (
            Invoice.objects.filter(
                project_id=project_id,
                status='paid'
            ).aggregate(
                total=Sum('total_amount')
            )['total']
            or Decimal('0.00')
        )

    @staticmethod
    def get_total_expenses(project_id):

        return (
            Expense.objects.filter(
                project_id=project_id
            ).aggregate(
                total=Sum('amount')
            )['total']
            or Decimal('0.00')
        )

    @staticmethod
    def get_total_labor_cost(project_id):

        return (
            TimeEntry.objects.filter(
                project_id=project_id,
                hourly_rate__isnull=False
            )
            .annotate(
                labor_cost=ExpressionWrapper(
                    (
                        F('duration_minutes') / 60.0
                    ) * F('hourly_rate'),
                    output_field=DecimalField(
                        max_digits=12,
                        decimal_places=2
                    )
                )
            )
            .aggregate(
                total=Sum('labor_cost')
            )['total']
            or Decimal('0.00')
        )

    @staticmethod
    def get_total_logged_minutes(project_id):

        return (
            TimeEntry.objects.filter(
                project_id=project_id
            ).aggregate(
                total=Sum('duration_minutes')
            )['total']
            or 0
        )

    @staticmethod
    def get_total_tasks(project_id):

        return Task.objects.filter(
            task_list__project=project_id
        ).count()

    @staticmethod
    def get_completed_tasks(project_id):

        return Task.objects.filter(
            task_list__project=project_id,
            completed = True
        ).count()

    @staticmethod
    def get_overdue_tasks(project_id):

        return Task.objects.filter(
            task_list__project=project_id,
            due_date__lt = timezone.now(),
            completed = False
        ).count()

    @staticmethod
    def get_in_progress_tasks(project_id):

        return Task.objects.filter(
            task_list__project=project_id,
            task_list__list_type='in_progress'            
        ).count()

    @staticmethod
    def get_completion_percentage(project_id):

        total = ProjectSelectors.get_total_tasks(project_id)

        if total == 0:
            return Decimal('0.00')

        completed = ProjectSelectors.get_completed_tasks(project_id)

        percentage = (Decimal(completed) / Decimal(total)) * 100

        return round(percentage, 2)


    # for if i make collaboration possible
    @staticmethod
    def get_active_team_members(project_id):

        return (
            TimeEntry.objects.filter(
                project_id=project_id
            ).values(
                'user'
            ).distinct().count()
        )

    @staticmethod
    def get_recent_activity_count(project_id, days=7):

        return ProjectActivity.objects.filter(
            project_id=project_id
        ).count()

    # @staticmethod
    # def get_stalled_tasks(project_id):

    #     return Task.objects.filter(
    #         task_list__project=project_id,
    #         task_list__list_type='in_progress',
    #         updated_at__lt=F('created_at')
    #     ).count()

    @staticmethod
    def get_project_overview(project_id):

        return {
            "revenue": ProjectSelectors.get_paid_revenue(project_id),
            "expenses": ProjectSelectors.get_total_expenses(project_id),
            "labor_cost": ProjectSelectors.get_total_labor_cost(project_id),
            "tasks_total": ProjectSelectors.get_total_tasks(project_id),
            "tasks_completed": ProjectSelectors.get_completed_tasks(project_id),
            "tasks_overdue": ProjectSelectors.get_overdue_tasks(project_id),
            "completion_percentage": (
                ProjectSelectors.get_completion_percentage(project_id)
            ),
        }

    @staticmethod
    def get_projects_with_metrics():

        return Project.objects.annotate(

            total_tasks=Count(
                'task_lists__tasks',
                distinct=True
            ),

            completed_tasks=Count(
                'task_lists__tasks',
                filter=Q(
                    task_lists__tasks__completed=True
                ),
                distinct=True
            ),

            overdue_tasks=Count(
                'task_lists__tasks',
                filter=Q(
                    task_lists__tasks__completed=False,
                    task_lists__tasks__due_date__lt=timezone.now()
                ),
                distinct=True
            ),

            total_time_logged=Sum(
                'task_lists__tasks__time_entries__duration_minutes'
            ),
        )
            

    @staticmethod
    def get_recent_completed_tasks(project_id, days=14):

        since = timezone.now() - timedelta(days=days)

        return Task.objects.filter(
            task_list__project_id=project_id,
            completed=True,
            updated_at__gte=since
        ).count()


    @staticmethod
    def get_last_activity(project_id):

        activity = (
            ProjectActivity.objects.filter(
                project_id=project_id
            ).order_by('-created_at').first()
        )

        if activity:
            return activity.created_at

        return None


    @staticmethod
    def get_stalled_tasks(project_id, days=7):

        threshold = timezone.now() - timedelta(days=days)

        return Task.objects.filter(
            task_list__project_id=project_id,
            completed=False,
            updated_at__lt=threshold
        ).count()
        
















