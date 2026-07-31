from django.conf import settings
from django.db import models


class AIRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="ai_requests",
    )
    raw_input = models.TextField()
    parsed_output = models.JSONField(null=True,blank=True)
    error_details = models.JSONField(null=True, blank=True)
    recovery_attempted = models.BooleanField(default=False)
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default="pending",db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "-created_at"]),
        ]


class AIWorkflowTask(models.Model):
    TASK_CHOICES = [
        ("extraction", "Extraction"),
        ("scope_analysis", "Scope Analysis"),
        ("pricing", "Pricing"),
        ("proposal_generation", "Proposal Generation"),
        ("contract_generation", "Contract Generation"),
        ("project_generation", "Project Generation"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("retrying", "Retrying"),
    ]

    request = models.ForeignKey(AIRequest, on_delete=models.CASCADE, related_name="workflow_tasks")
    task_type = models.CharField(max_length=30, choices=TASK_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    error_details = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ScopeAnalysisRecord(models.Model):
    request = models.ForeignKey(AIRequest,on_delete=models.CASCADE)
    analysis = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class PricingRecord(models.Model):
    request = models.ForeignKey(AIRequest, on_delete=models.CASCADE)
    pricing = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class ProposalRecord(models.Model):
    request = models.ForeignKey(AIRequest, on_delete=models.CASCADE)
    proposal = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

