from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from .tasks import send_notifications_task

@receiver(post_save, sender=Notification, dispatch_uid="send_notification_signal")
def send_notification_signal(sender, instance, created, **kwargs):
    if created:
        send_notifications_task.delay_on_commit(instance.id)





