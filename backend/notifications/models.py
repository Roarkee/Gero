from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('invoice_overdue', 'Invoice Overdue'),
        ('budget_exceeded', 'Budget Exceeded'),
        ('budget_warning', 'Budget Warning (80%)'),
        ('payment_received', 'Payment Received'),
        ('project_deadline', 'Project Deadline'),
        ('task_overdue', 'Task Overdue'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    is_read = models.BooleanField(default=False)
    action_url = models.URLField(blank=True)  # URL to navigate to when clicked

    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"