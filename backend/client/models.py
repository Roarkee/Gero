from django.db import models
from django.conf import settings

# Create your models here.
class Client(models.Model):
    STATUS_CHOICES = [
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
    

    
    def __str__(self):
        return self.name

