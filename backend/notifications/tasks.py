from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from invoices.models import Invoice
from projects.models import Task
from expenses.models import Expense,Budget
from .models import Notification
from django.urls import reverse
from decimal import Decimal
from .services import create_notification


'''will add notifications for the intelligence reports'''

@shared_task
def send_notifications_task(notification_id):
    '''
    this is a basic celery task that sends a notification to a
    user via a channel. the signal calls this method and it is
    run every time a notification is created in the db
    '''
    from .models import Notification
    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
    except Notification.DoesNotExist:
        return
    channel_layer= get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        f"user_{notification.user.id}_group",
        {
            "type": "notify",
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.type,
            "extra":{
                "action_url": notification.action_url,
                "id": notification.id
            }
        }

    )
@shared_task
def notify_invoice_overdue():
    '''
    this task searches for overdue invoices, creates a notification
    and pushes the notification to the user. it is scheduled to run at midnight
    every day
    '''
    now = timezone.now().date()
    overdue_invoices = Invoice.objects.filter(
        status = 'overdue',
        due_date__lt = now,
    ).select_related('user', 'client')

    for invoice in overdue_invoices:
        overdue = (now - invoice.due_date).days
        notification = create_notification(
            user=invoice.user,
            event_key=f"invoice_overdue:{invoice.id}",
            notification_type='invoice_overdue',
            title=f'Invoice{invoice.invoice_number} is overdue by {overdue} days',
            message=f'{invoice.client.name.upper()} has an outstanding balance of {invoice.total_amount} left to pay',

        )



@shared_task
def notify_task_deadline():
    '''
    this task searches for projects with deadlines in the next 3 days,
    creates a notification and pushes the notification to the user.
    it is scheduled to run at midnight every day
    '''

    
    now = timezone.now()
    upcoming_deadline = now + timezone.timedelta(days=3)
    tasks = Task.objects.filter(
        duedate__lte = upcoming_deadline,
        duedate__gte = now,
    ).select_related('user')

    for task in tasks:
        url = reverse('projects:task',args=[task.id])
        days_left = (task.duedate - now).days
        notification = Notification.objects.create(
            user=task.user,
            type='task_overdue',
            title=f'Project {task.title} deadline in {days_left} days',
            message=f'The deadline for project {task.name} is on {task.duedate.strftime("%Y-%m-%d")}. Please ensure all tasks are completed on time.',
            action_url=url
        )
        send_notifications_task.delay_on_commit(notification.id)

@shared_task
def notify_followup_overdue():
    '''
    Finds clients whose next_followup_at has passed and sends a notification.
    '''
    from client.models import Client
    now = timezone.now()
    clients = Client.objects.filter(
        next_followup_at__lt=now,
        status__in=['lead', 'inquiry', 'proposal_sent', 'negotiating', 'active', 'dormant']
    ).select_related('user')

    for client in clients:
        # Assuming frontend client detail page uses this format
        url = f'/clients/{client.id}'
        notification = Notification.objects.create(
            user=client.user,
            type='follow_up_overdue',
            title=f'Follow-up due for {client.name}',
            message=f'You have a scheduled follow-up for client {client.name} that is now overdue.',
            action_url=url
        )
        send_notifications_task.delay_on_commit(notification.id)
        
        # Optionally, clear the followup date so we don't notify repeatedly every night
        client.next_followup_at = None
        client.save(update_fields=['next_followup_at'])

        
@shared_task
def notify_budget_status():
    """
    Check active budgets and notify users when:
    - 80% of the budget has been used
    - The budget has been exceeded

    Each threshold generates only one notification
    for a particular budget period.
    """

    today = timezone.now().date()

    budgets = Budget.objects.filter(
        start_date__lte=today,
        end_date__gte=today,
    ).select_related(
        'user',
        'category',
    )

    from .services import create_notification

    for budget in budgets:

        spent = budget.spent_amount

        if budget.amount <= 0:
            continue

        percentage_used = (
            spent / budget.amount
        ) * Decimal('100')

        if percentage_used >= Decimal('100'):

            create_notification(
                user=budget.user,
                notification_type='budget_exceeded',
                title='Budget exceeded',
                message=(
                    f'Your {budget.category.name} budget has '
                    f'been exceeded. You have spent '
                    f'{spent} out of {budget.amount}.'
                ),
                event_key=(
                    f'budget_exceeded:{budget.id}'
                ),
                action_url=f'/expenses/budgets/{budget.id}',
            )

        elif percentage_used >= Decimal('80'):

            create_notification(
                user=budget.user,
                notification_type='budget_warning',
                title='Budget nearing its limit',
                message=(
                    f'Your {budget.category.name} budget is '
                    f'{percentage_used:.0f}% used. '
                    f'You have {budget.remaining_amount} '
                    f'remaining.'
                ),
                event_key=(
                    f'budget_warning:{budget.id}'
                ),
                action_url=f'/expenses/budgets/{budget.id}',
            )