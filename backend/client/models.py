from django.db import models
from django.conf import settings

# Create your models here.
class Client(models.Model):


    STATUS_CHOICES =[
    ('lead', 'Lead'),
    ('inquiry', 'Inquiry'),
    ('proposal_sent', 'Proposal Sent'),
    ('negotiating', 'Negotiating'),
    ('onboarding', 'Onboarding'),
    ('active', 'Active'),
    ('waiting_on_client', 'Waiting On Client'),
    ('revision', 'Revision'),
    ('completed', 'Completed'),
    ('paused', 'Paused'),
    ('dormant', 'Dormant'),
    ('churned', 'Churned'),
]
    
    SOURCE_CHOICES = [
    ('referral', 'Referral'),
    ('linkedin', 'LinkedIn'),
    ('twitter', 'Twitter'),
    ('website', 'Website'),
    ('cold_outreach', 'Cold Outreach'),
]
    
    user= models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='clients')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    company_name= models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    website = models.CharField(max_length=200, blank=True, null=True)
    note = models.CharField(max_length=200, blank=True, null=True)
    default_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    next_followup_at = models.DateTimeField(null=True, blank=True)
    lifetime_value = models.DecimalField(max_digits=12,decimal_places=2,default=0)
    min_budget = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    null=True,
    blank=True
)

    max_budget = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    null=True,
    blank=True
)
    source = models.CharField(max_length=200, blank=True, null=True, choices=SOURCE_CHOICES)
    
    # Intelligence Fields
    status_changed_at = models.DateTimeField(auto_now_add=True,blank=True, null=True)
    last_activity_at = models.DateTimeField(auto_now_add=True,blank=True, null=True)
    health_score = models.IntegerField(default=100)
    health_label = models.CharField(max_length=20, default='healthy')
    engagement_score = models.IntegerField(default=100)
    risk_score = models.IntegerField(default=0)
    attention_required = models.BooleanField(default=False)
    dormant_since = models.DateTimeField(null=True, blank=True)
    average_project_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    client_priority = models.CharField(max_length=20, default='normal')
    client_segment = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'health_label']),
            models.Index(fields=['user', 'attention_required']),
            models.Index(fields=['next_followup_at']),
        ]
    
    def __str__(self):
        return self.name


class ClientActivity(models.Model):

    ACTIVITY_TYPES = [
        ('note', 'Note'),
        ('status_change', 'Status Change'),
        ('email', 'Email'),
        ('call', 'Call'),
        ('meeting', 'Meeting'),
        ('project_created', 'Project Created'),
        ('project_completed', 'Project Completed'),
        ('client_created', 'Client Created'),
        ('follow_up_scheduled', 'Follow-up Scheduled'),
        ('follow_up_completed', 'Follow-up Completed'),
        ('invoice_paid', 'Invoice Paid'),
        ('invoice_overdue', 'Invoice Overdue'),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='activities'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    activity_type = models.CharField(
        max_length=50,
        choices=ACTIVITY_TYPES
    )

    description = models.TextField()

    metadata = models.JSONField(
        default=dict,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'created_at']),
        ]

    def __str__(self):
        return f"{self.client.name} - {self.activity_type}"

