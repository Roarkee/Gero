from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Notification
from invoices.models import Invoice
from payments.models import PaymentTransaction
from projects.models import Project, Task
from .tasks import send_notifications_task

@receiver(post_save, sender=Notification, dispatch_uid="send_notification_signal")
def send_notification_signal(sender, instance, created, **kwargs):
    if created:
        try:
            send_notifications_task.delay_on_commit(instance.id)
        except Exception:
            pass

@receiver(pre_save, sender=Invoice)
def track_invoice_status(sender, instance, **kwargs):
    if instance.pk:
        orig = Invoice.objects.filter(pk=instance.pk).first()
        if orig:
            instance._original_status = orig.status

@receiver(post_save, sender=Invoice)
def notify_on_invoice_change(sender, instance, created, **kwargs):
    action_url = f"/invoices/{instance.id}"
    client_name = getattr(instance.client, 'name', 'Client')
    inv_title = instance.title or instance.invoice_number

    if created:
        Notification.objects.create(
            user=instance.user,
            type='invoice_viewed',
            title=f"New Invoice Created: {inv_title}",
            message=f"Invoice for {client_name} totaling {getattr(instance, 'currency', '$')}{instance.total_amount} was created.",
            action_url=action_url
        )
        return
    
    orig_status = getattr(instance, '_original_status', None)
    if not orig_status or orig_status == instance.status:
        return

    if instance.status == Invoice.InvoiceStatus.OVERDUE:
        Notification.objects.create(
            user=instance.user,
            type='invoice_overdue',
            title=f"Invoice Overdue: {inv_title}",
            message=f"Invoice for {client_name} is now overdue.",
            action_url=action_url
        )
    elif instance.status == Invoice.InvoiceStatus.PAID:
        Notification.objects.create(
            user=instance.user,
            type='payment_received',
            title=f"Invoice Paid: {inv_title}",
            message=f"Payment received in full for invoice {inv_title} from {client_name}.",
            action_url=action_url
        )
    elif instance.status == Invoice.InvoiceStatus.SENT:
        Notification.objects.create(
            user=instance.user,
            type='invoice_viewed',
            title=f"Invoice Sent: {inv_title}",
            message=f"Invoice sent to {client_name}.",
            action_url=action_url
        )

@receiver(post_save, sender=PaymentTransaction)
def notify_on_payment_success(sender, instance, created, **kwargs):
    if instance.status == 'completed' and not getattr(instance, '_notified', False):
        try:
            invoice = instance.payment_intent.invoice
            Notification.objects.create(
                user=instance.payment_intent.user,
                type='payment_received',
                title="Payment Received",
                message=f"Received {instance.currency} {instance.amount} from {invoice.client.name}.",
                action_url=f"/invoices/{invoice.id}"
            )
            instance._notified = True  # Prevent duplicate notification for same memory instance
        except AttributeError:
            pass

@receiver(post_save, sender=Project)
def notify_on_project_assigned(sender, instance, created, **kwargs):
    if created and getattr(instance, 'client', None) and getattr(instance.client, 'user_account', None):
        Notification.objects.create(
            user=instance.client.user_account,
            type='project_deadline',
            title="New Project Assigned",
            message=f"You have been assigned to project: {instance.name}",
            action_url=f"/client-portal/projects/{instance.id}"
        )

@receiver(post_save, sender=Task)
def notify_on_task_overdue(sender, instance, created, **kwargs):
    # This might require a periodic task, but if saved while overdue:
    pass
