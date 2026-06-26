from django.conf import settings
from django.db import models

# Create your models here.


class AIRequest(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed")
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,null=True,blank=True,related_name="ai_requests")
    raw_input = models.TextField()
    parsed_output = models.JSONField(null=True,blank=True)
    status = models.CharField(max_length=20,choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)


class AITask(models.Model):

    TASK_CHOICES = [
        ("extract", "Extract"),
        ("proposal", "Proposal"),
        ("contract", "Contract"),
        ("pricing", "Pricing")
    ]
    request = models.ForeignKey(AIRequest,on_delete=models.CASCADE)
    task_type = models.CharField(max_length=20,choices=TASK_CHOICES)
    status = models.CharField(max_length=20)
    output = models.JSONField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)