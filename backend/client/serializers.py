from rest_framework import serializers
from .models import Client, ClientActivity
from projects.serializers import ProjectSerializer, Task

class ClientActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientActivity
        fields = ['id', 'activity_type', 'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']

class ClientListSerializer(serializers.ModelSerializer):
    has_portal_access = serializers.SerializerMethodField()
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'email', 'phone_number', 'company_name', 
            'website', 'status', 'created_at', 'health_score', 'health_label', 
            'attention_required', 'client_priority', 'next_followup_at',
            'last_contacted_at', 'lifetime_value', 'has_portal_access'
        ]
        read_only_fields = ['id', 'created_at', 'health_score', 'health_label', 'attention_required']
        
    def get_has_portal_access(self, obj):
        return obj.user_account_id is not None

class ClientDetailSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)
    total_projects = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()
    recent_activities = serializers.SerializerMethodField()
    has_portal_access = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'email', 'phone_number', 'company_name', 
            'website', 'note', 'status', 'source', 'default_hourly_rate', 
            'min_budget', 'max_budget', 'lifetime_value', 'last_contacted_at', 
            'next_followup_at', 'created_at', 'updated_at', 'status_changed_at', 
            'last_activity_at', 'health_score', 'health_label', 'engagement_score', 
            'risk_score', 'attention_required', 'dormant_since', 'average_project_value', 
            'client_priority', 'client_segment', 'projects', 'total_projects', 
            'total_tasks', 'recent_activities', 'has_portal_access'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status_changed_at', 'last_activity_at']

    def get_has_portal_access(self, obj):
        return obj.user_account_id is not None

    def get_total_projects(self, obj):
        return obj.projects.count()
    
    def get_total_tasks(self, obj):
        return Task.objects.filter(task_list__project__client=obj).count()

    def get_recent_activities(self, obj):
        activities = ClientActivity.objects.filter(client=obj).order_by('-created_at')[:5]
        return ClientActivitySerializer(activities, many=True).data

class ClientWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'name', 'email', 'phone_number', 'company_name', 
            'website', 'note', 'status', 'source', 'default_hourly_rate', 
            'min_budget', 'max_budget', 'next_followup_at', 'client_priority'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        client = Client.objects.create(user=user, **validated_data)
        return client
    
    def validate_email(self, value):
        user = self.context['request'].user
        # Exclude current instance in case of update
        qs = Client.objects.filter(user=user, email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("You already have a client with this email.")
        return value
