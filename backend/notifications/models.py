from django.db import models
from django.conf import settings

class Notification(models.Model):

    NOTIFICATION_TYPES = [
        ('invoice_overdue', 'Invoice Overdue'),
        ('invoice_due_soon', 'Invoice Due Soon'),
        ('Invoice Paid', 'Invoice Paid'),
        ('budget_warning', 'Budget Warning'),
        ('budget_exceeded', 'Budget Exceeded'),
        ('project_deadline', 'Project Deadline'),
        ('follow_up_overdue', 'Follow-up Overdue'),
        ('project_risk', 'Project Risk'),
        ('cash_flow_warning', 'Cash Flow Warning'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='notifications')
    type = models.CharField(max_length=30,choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    event_key = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True,blank=True)

    class Meta:
        ordering = ['-created_at']

        constraints = [
            models.UniqueConstraint(
                fields=['user', 'event_key'],
                name='unique_user_notification_event'
            )
        ]

        indexes = [
            models.Index(
                fields=['user', 'is_read']
            ),
            models.Index(
                fields=['user', 'created_at']
            ),
        ]