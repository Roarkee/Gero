from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Client, ClientActivity
from .services import ActivityLoggingService

@receiver(pre_save, sender=Client)
def update_status_changed_at(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Client.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                instance.status_changed_at = timezone.now()
        except Client.DoesNotExist:
            pass

@receiver(post_save, sender=Client)
def log_client_creation_and_status(sender, instance, created, **kwargs):
    if created:
        ActivityLoggingService.log_activity(
            client=instance,
            user=instance.user,
            activity_type='client_created',
            description=f"Client '{instance.name}' was created."
        )
    else:
        # We also need to check if status changed. 
        # Since we can't easily get old_instance in post_save directly, 
        # we could use pre_save to store a flag, but this is a simpler approach:
        # For a robust approach, we can track old status in pre_save and read it in post_save.
        if hasattr(instance, '_status_changed'):
            ActivityLoggingService.log_activity(
                client=instance,
                user=instance.user,
                activity_type='status_change',
                description=f"Status changed to {instance.get_status_display()}.",
                metadata={'status': instance.status}
            )

@receiver(pre_save, sender=Client)
def detect_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Client.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                instance._status_changed = True
        except Client.DoesNotExist:
            pass

@receiver(post_save, sender=ClientActivity)
def update_client_last_activity(sender, instance, created, **kwargs):
    if created:
        # Update client.last_activity_at without triggering signals
        Client.objects.filter(pk=instance.client_id).update(last_activity_at=timezone.now())
