from django.db.models.signals import post_save
from django.dispatch import receiver

from projects.models import Task
from intelligence.project.services import ProjectDeliveryService


@receiver(post_save, sender=Task)
def update_project_delivery(sender, instance, created, update_fields=None, **kwargs):

    relevant_fields = {
        'status',
        'priority',
        'estimated_hours',
        'actual_hours',
        'due_date'
    }

    if update_fields is not None:

        if not relevant_fields.intersection(update_fields):
            return

    project = instance.task_list.project

    ProjectDeliveryService.get_delivery_metrics(project.id)

    