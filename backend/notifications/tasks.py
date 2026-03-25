from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from invoices.models import Invoice
from projects.models import Task
from expenses.models import Expense,Budget
from .models import Notification
from django.urls import reverse



@shared_task
def send_notifications_task(notification_id):
    '''
    this is a basic celery task that sends a notification to a
    user via a channel. the signal calls this method and it is
    run every time a notification is created in the db
    '''
    from .models import Notification
    try:
        notification = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        return
    channel_layer= get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        f"user_{notification.user.id}_group",
        {
            "type": "notify",
            "title": notification.title,
            "message": notification.message,
            "noti_type": notification.type,
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
    now = timezone.now()
    overdue_invoices = Invoice.objects.filter(
        status = 'overdue',
        due_date__lt = now,
    ).select_related('user', 'client')

    for invoice in overdue_invoices:
        overdue = (now - invoice.due_date).days
        notification = Notification.objects.create(
            user=invoice.user.id,
            type='invoice_overdue',
            title=f'Invoice{invoice.invoice_number} is overdue by {overdue} days',
            message=f'{invoice.client.name.upper()} has an outstanding balance of {invoice.total_amount} left to pay',

        )

        send_notifications_task.delay_on_commit(notification.id)


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

        
