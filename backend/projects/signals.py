from django.db.models.signals import post_save
from django.dispatch import receiver

from projects.models import Task
from projects.services.DeliveryIntelligenceService import DeliveryIntelligenceService


@receiver(post_save, sender=Task)
def update_project_delivery(sender, instance, **kwargs):

    project = instance.task_list.project

    DeliveryIntelligenceService(project).calculate()