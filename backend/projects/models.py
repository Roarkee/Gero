from django.db import models
from django.conf import settings
from client.models import Client
from rest_framework.serializers import ValidationError


# Create your models here.
class Project(models.Model):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    BILLING_TYPE_CHOICES = [
        ('hourly', 'Hourly'),
        ('fixed', 'Fixed Price'),
        ('retainer', 'Retainer'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    client = models.ForeignKey(Client,on_delete=models.CASCADE,related_name='projects', null=True, blank=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='active')
    completed = models.BooleanField(default=False)
    billing_type = models.CharField(max_length=20,choices=BILLING_TYPE_CHOICES,default='hourly')
    hourly_rate = models.DecimalField(max_digits=10,decimal_places=2,null=True,blank=True)
    fixed_price = models.DecimalField(max_digits=12,decimal_places=2,null=True,blank=True)
    budget = models.DecimalField(max_digits=12,decimal_places=2,null=True,blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='medium'
    )
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-created_at']

        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['client']),
            models.Index(fields=['completed']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return self.name

        
class TaskList(models.Model): 
    name = models.CharField(max_length=100)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='task_lists',db_index=True)
    position = models.PositiveIntegerField(default=0)
    list_type = models.CharField(max_length=20, choices=[
        ('backlog', 'Backlog'),
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Done'),
        ('custom', 'Custom'),
    ], default='custom')
    
    class Meta:
        ordering = ['position']


class Label(models.Model):
    name=models.CharField(max_length=50, null=False, blank=False)
    color=models.CharField(max_length=20, null=False, blank=False)
    project=models.ForeignKey(Project, on_delete=models.CASCADE, related_name='labels')



class Task(models.Model):
    title=models.CharField(max_length=40, null=False, blank=False)
    description=models.CharField(max_length=255, null=True, blank=True)
    task_list=models.ForeignKey(TaskList, on_delete=models.CASCADE, related_name='tasks',db_index=True)
    labels=models.ManyToManyField(Label, related_name='tasks')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    start_date=models.DateTimeField(null=True, blank=True)
    due_date=models.DateTimeField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)  # For drag-and-drop ordering
    priority = models.CharField(max_length=10, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ], default='medium')
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    completed = models.BooleanField(default = False)
    class Meta:
        ordering = ['position']
        
    def save(self, *args, **kwargs):
        if self.pk:
            orig = Task.objects.get(pk=self.pk)
            if self.completed and not orig.completed:
                self.subtasks.all().update(completed=True)
        super().save(*args, **kwargs)
    


class SubTask(models.Model):
    todo=models.CharField(max_length=255, null=False, blank=False)
    task=models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    completed=models.BooleanField(default=False)
    label=models.ForeignKey(Label, on_delete=models.CASCADE, related_name='subtasks', null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    position= models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.completed:
            task = self.task
            if task.subtasks.exists() and not task.subtasks.filter(completed=False).exists():
                if not task.completed:
                    task.completed = True
                    task.save(update_fields=['completed'])


class TimeEntry(models.Model):

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries',db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_entries',db_index=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_index=True, null=True)
    is_billable = models.BooleanField(default=True)
    invoice = models.ForeignKey('invoices.Invoice', null=True, blank=True, on_delete=models.SET_NULL)
    description = models.CharField(max_length=255, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)  # Calculated field
    is_running = models.BooleanField(default=False)  # For active timers
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_running']),
            models.Index(fields=['project', 'is_billable']),
            models.Index(fields=['start_time']),
        ]
    
    def __str__(self):
        return f"{self.task.title} - {self.duration_minutes}min"
    
    def save(self, *args, **kwargs):
        self.full_clean()
        if self.end_time and self.start_time:
            duration = self.end_time - self.start_time
            self.duration_minutes = int(duration.total_seconds() / 60)
            self.is_running = False
        self.project = self.task.task_list.project
        if not self.hourly_rate:
            if self.task.task_list.project.hourly_rate:
                self.hourly_rate = self.task.task_list.project.hourly_rate
        super().save(*args, **kwargs)

    def clean(self):
        if self.task.task_list.project.client.user != self.user:
            raise ValidationError("You cannot log time on another user's project")
        if self.is_running:
            overlapping = TimeEntry.objects.filter(
                user=self.user,
                is_running=True
            ).exclude(id=self.id)

            if overlapping.exists():
                raise ValidationError(
                    "Another timer is already running."
            )

    
    @property
    def billable_amount(self):
        if self.hourly_rate:
            hours = self.duration_minutes / 60
            return hours * self.hourly_rate
        return 0


class ProjectActivity(models.Model):

    ACTIVITY_TYPES = [
        ('project_created', 'Project Created'),
        ('project_updated', 'Project Updated'),

        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_deleted', 'Task Deleted'),

        ('task_moved', 'Task Moved'),
        ('task_completed', 'Task Completed'),

        ('comment_added', 'Comment Added'),

        ('timer_started', 'Timer Started'),
        ('timer_stopped', 'Timer Stopped'),

        ('file_uploaded', 'File Uploaded'),

        ('label_added', 'Label Added'),

        ('member_added', 'Member Added'),
    ]

    project = models.ForeignKey('Project',on_delete=models.CASCADE,related_name='activities')
    task = models.ForeignKey('Task',null=True,blank=True,on_delete=models.CASCADE,related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=50,choices=ACTIVITY_TYPES)
    description = models.TextField()
    metadata = models.JSONField(default=dict,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.name} - {self.activity_type}"



class Attachment(models.Model):
    project = models.ForeignKey('Project',on_delete=models.CASCADE,related_name='attachments')
    task = models.ForeignKey('Task',null=True,blank=True,on_delete=models.CASCADE,related_name='attachments')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    file = models.FileField(upload_to='project_attachments/')
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=100,blank=True)
    client_visible = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.file_name


class RecurringTask(models.Model):

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom'),
    ]
    RECURCHOICES = [
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ]
    project = models.ForeignKey('Project',on_delete=models.CASCADE,related_name='recurring_tasks')
    task_list = models.ForeignKey('TaskList',on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20,choices=FREQUENCY_CHOICES)
    interval = models.PositiveIntegerField(default=1)
    next_run = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    priority = models.CharField(max_length=10,choices=RECURCHOICES,default='medium')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.title



# would use this when i want to add collaboration
# as at this time i won't be using this
class TaskComment(models.Model):
    task = models.ForeignKey('Task',on_delete=models.CASCADE,related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} comment"


class ProjectInsight(models.Model):

    RISK_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    project = models.OneToOneField(Project,on_delete=models.CASCADE,related_name='insight')
    total_tasks = models.PositiveIntegerField(default=0)
    completed_tasks = models.PositiveIntegerField(default=0)
    active_tasks = models.PositiveIntegerField(default=0)
    overdue_tasks = models.PositiveIntegerField(default=0)
    blocked_tasks = models.PositiveIntegerField(default=0)
    completion_percentage = models.PositiveIntegerField(default=0)
    completion_velocity = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    estimated_completion_date = models.DateTimeField(null=True,blank=True)
    stalled = models.BooleanField(default=False)
    last_activity_at = models.DateTimeField(null=True,blank=True)
    total_logged_hours = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    estimated_hours = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    utilization_rate = models.DecimalField(max_digits=5,decimal_places=2,default=0)
    revenue = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    expenses = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    profit = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    profit_margin = models.DecimalField(max_digits=5,decimal_places=2,default=0)
    budget_used_percentage = models.DecimalField(max_digits=5,decimal_places=2,default=0)
    outstanding_invoice_amount = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    paid_invoice_amount = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    overdue_invoice_amount = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    payment_risk_score = models.PositiveIntegerField(default=0)
    risk_level = models.CharField(max_length=20,choices=RISK_LEVELS,default='low')
    risk_score = models.PositiveIntegerField(default=0)
    at_risk = models.BooleanField(default=False)
    avg_task_completion_time = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    team_efficiency_score = models.PositiveIntegerField(default=100)
    projected_final_profit = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    projected_completion_days = models.PositiveIntegerField(default=0)
    projected_over_budget = models.BooleanField(default=False)
    last_calculated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [
            models.Index(fields=['risk_level']),
            models.Index(fields=['stalled']),
            models.Index(fields=['at_risk']),
        ]

    def __str__(self):
        return f"Insights for {self.project.name}"











