from ai.models import AIRequest
from rest_framework import serializers


class AIRequestSerializer(serializers.ModelSerializer):
    current_stage = serializers.SerializerMethodField()

    class Meta:
        model = AIRequest
        fields = "__all__"
        read_only_fields = ["user"]

    def get_current_stage(self, obj):
        STAGE_ORDER = [
            "extraction",
            "scope_analysis",
            "pricing",
            "proposal_generation",
            "project_generation",
            "contract_generation",
        ]
        
        # Get all completed tasks to determine how far along the workflow is
        tasks = obj.workflow_tasks.filter(status="completed")
        if not tasks.exists():
            # Check if extraction is processing or failed
            extraction_task = obj.workflow_tasks.filter(task_type="extraction").first()
            if extraction_task:
                if extraction_task.status == "failed":
                    return "extraction_failed"
                return "extraction_processing"
            return "pending"

        highest_stage = -1
        for task in tasks:
            if task.task_type in STAGE_ORDER:
                highest_stage = max(highest_stage, STAGE_ORDER.index(task.task_type))
                
        if highest_stage == -1:
            return "unknown"
            
        return STAGE_ORDER[highest_stage]