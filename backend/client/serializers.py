from rest_framework import serializers
from client.models import Client
from projects.serializers import ProjectSerializer, Task


class ClientSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)#i'm specifying that the projects field
    total_projects = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    unpaid_invoices_total = serializers.SerializerMethodField()
    active_projects_count = serializers.SerializerMethodField()

    class Meta:
        model= Client
        fields = [
            'id', 'name', 'email', 'phone_number', 'company_name', 'status', 
            'created_at', 'billing_currency', 'billing_address', 'default_hourly_rate',
            'projects', 'total_projects', 'total_tasks', 
            'total_revenue', 'unpaid_invoices_total', 'active_projects_count'
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_projects(self, obj):
        return obj.projects.count()
    
    def get_total_tasks(self, obj):
        return Task.objects.filter(task_list__project__client=obj).count()

    def get_total_revenue(self, obj):
        return getattr(obj, 'total_revenue', 0.0)

    def get_unpaid_invoices_total(self, obj):
        return getattr(obj, 'unpaid_invoices_total', 0.0)

    def get_active_projects_count(self, obj):
        return getattr(obj, 'active_projects_count', 0)

    def create(self, validated_data):
        # i'm assigning the user to the client to make sure that the client is created by the authenticated user
        user = self.context['request'].user
        client = Client.objects.create(user=user, **validated_data)
        return client
    
    def validate_email(self, value):
        user = self.context['request'].user
        if Client.objects.filter(user=user, email=value).exists():
            raise serializers.ValidationError("You already have a client with this email.")
        return value
    
    def update(self, instance, validated_data):
        validated_data.pop('user', None)  # prevent changing user
        return super().update(instance, validated_data)
        




    

