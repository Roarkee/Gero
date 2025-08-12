from django.db import models
from django.conf import settings
from client.models import Client


# Create your models here.
class Project(models.Model):   #this models the trello workspace

    name=models.CharField(max_length=100)
    client=models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    description=models.CharField(max_length=255)
    completed=models.BooleanField(default=False)
    status=models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive'), ('completed', 'Completed'), ('pending', 'Pending')], default='active')
  

class TaskList(models.Model): 
    name = models.CharField(max_length=100)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='task_lists')
    position = models.PositiveIntegerField(default=0)     


class Label(models.Model):
    name=models.CharField(max_length=50, null=False, blank=False)
    color=models.CharField(max_length=20, null=False, blank=False)
    project=models.ForeignKey(Project, on_delete=models.CASCADE, related_name='labels')



class Task(models.Model):
    title=models.CharField(max_length=40, null=False, blank=False)
    description=models.CharField(max_length=255, null=True, blank=True)
    task_list=models.ForeignKey(TaskList, on_delete=models.CASCADE, related_name='tasks')
    labels=models.ManyToManyField(Label, related_name='tasks')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    startdate=models.DateTimeField(null=True, blank=True)
    duedate=models.DateTimeField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)  # For drag-and-drop ordering
    


class SubTask(models.Model):
    todo=models.CharField(max_length=255, null=False, blank=False)
    task=models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    completed=models.BooleanField(default=False)
    label=models.ForeignKey(Label, on_delete=models.CASCADE, related_name='subtasks', null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    position= models.PositiveIntegerField(default=0)








class TimeEntry(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_entries')
    
    description = models.CharField(max_length=255, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)  # Calculated field
    
    is_running = models.BooleanField(default=False)  # For active timers
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.task.title} - {self.duration_minutes}min"
    
    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.duration_minutes = int(duration.total_seconds() / 60)
            self.is_running = False
        super().save(*args, **kwargs)
    
    @property
    def billable_amount(self):
        if self.hourly_rate:
            hours = self.duration_minutes / 60
            return hours * self.hourly_rate
        return 0