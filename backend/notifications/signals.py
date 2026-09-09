from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from payments.models import PaymentTransaction
from projects.models import Project, Task

from .services import create_notification





@receiver(post_save, sender=PaymentTransaction)
def notify_on_payment_success(sender, instance, created, **kwargs):
    if instance.status == 'completed' and not getattr(instance, '_notified', False):
        try:
            invoice = instance.invoice
            create_notification(
                user=instance.invoice.user,
                event_key=f"invoice_paid:{invoice.id}",
                notification_type='invoice_paid',
                title="Payment Received",
                message=f"Received {instance.currency} {instance.amount} from {invoice.client.name}.",
                action_url=f"/invoices/{invoice.id}"
            )
            instance._notified = True  # Prevent duplicate notification for same memory instance
        except AttributeError:
            pass









