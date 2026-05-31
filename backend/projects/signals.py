from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from .models import Project, Task, TimeEntry, Attachment, ProjectActivity, Label
from django.utils import timezone

@receiver(post_save, sender=Project)
def log_project_activity(sender, instance, created, **kwargs):
    activity_type = 'project_created' if created else 'project_updated'
    description = f"Project '{instance.name}' was {'created' if created else 'updated'}."
    
    ProjectActivity.objects.create(
        project=instance,
        user=instance.user,
        activity_type=activity_type,
        description=description
    )

@receiver(pre_save, sender=Task)
def check_task_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            instance._old_completed = old_instance.completed
            instance._old_task_list = old_instance.task_list
        except Task.DoesNotExist:
            pass

@receiver(post_save, sender=Task)
def log_task_activity(sender, instance, created, **kwargs):
    user = instance.task_list.project.user # Fallback to project user as task model doesn't store created_by currently
    
    if created:
        ProjectActivity.objects.create(
            project=instance.task_list.project,
            task=instance,
            user=user,
            activity_type='task_created',
            description=f"Task '{instance.title}' was created."
        )
    else:
        # Check specific updates
        if hasattr(instance, '_old_completed') and instance.completed and not instance._old_completed:
            ProjectActivity.objects.create(
                project=instance.task_list.project,
                task=instance,
                user=user,
                activity_type='task_completed',
                description=f"Task '{instance.title}' was completed."
            )
        elif hasattr(instance, '_old_task_list') and instance.task_list != instance._old_task_list:
            ProjectActivity.objects.create(
                project=instance.task_list.project,
                task=instance,
                user=user,
                activity_type='task_moved',
                description=f"Task '{instance.title}' was moved to {instance.task_list.name}."
            )
        else:
            ProjectActivity.objects.create(
                project=instance.task_list.project,
                task=instance,
                user=user,
                activity_type='task_updated',
                description=f"Task '{instance.title}' was updated."
            )

@receiver(post_delete, sender=Task)
def log_task_delete_activity(sender, instance, **kwargs):
    ProjectActivity.objects.create(
        project=instance.task_list.project,
        user=instance.task_list.project.user,
        activity_type='task_deleted',
        description=f"Task '{instance.title}' was deleted."
    )

@receiver(post_save, sender=TimeEntry)
def log_time_entry_activity(sender, instance, created, **kwargs):
    if created and instance.is_running:
        ProjectActivity.objects.create(
            project=instance.project or instance.task.task_list.project,
            task=instance.task,
            user=instance.user,
            activity_type='timer_started',
            description=f"Timer started for task '{instance.task.title}'."
        )
    elif not created and not instance.is_running and getattr(instance, '_old_is_running', True):
        ProjectActivity.objects.create(
            project=instance.project or instance.task.task_list.project,
            task=instance.task,
            user=instance.user,
            activity_type='timer_stopped',
            description=f"Timer stopped for task '{instance.task.title}'."
        )

@receiver(pre_save, sender=TimeEntry)
def check_timer_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = TimeEntry.objects.get(pk=instance.pk)
            instance._old_is_running = old_instance.is_running
        except TimeEntry.DoesNotExist:
            pass

@receiver(post_save, sender=Attachment)
def log_attachment_activity(sender, instance, created, **kwargs):
    if created:
        ProjectActivity.objects.create(
            project=instance.project,
            task=instance.task,
            user=instance.uploaded_by,
            activity_type='file_uploaded',
            description=f"File '{instance.file_name}' was uploaded."
        )

@receiver(post_save, sender=Label)
def log_label_activity(sender, instance, created, **kwargs):
    if created:
        ProjectActivity.objects.create(
            project=instance.project,
            user=instance.project.user,
            activity_type='label_added',
            description=f"Label '{instance.name}' was added to the project."
        )
