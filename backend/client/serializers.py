from rest_framework import serializers
from client.models import Client
from projects.serializers import ProjectSerializer, Task


class ClientDetailSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)#i'm specifying that the projects field
    total_projects = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()
    class Meta:
        model= Client
        fields = ['projects', 'id', 'name', 'email', 'phone_number','company_name', 'status', 'created_at', 'total_tasks', 'total_projects']
        read_only_fields = ['id', 'created_at']

    # 
    def get_total_projects(self, obj):
        return obj.projects.count()
    
    # this causes the n+1 query problem. change in the future
    def get_total_tasks(self, obj):
        return Task.objects.filter(task_list__project__client=obj).count()

        

class ClientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = "__all__"
        read_only_fields = ["id", "created_at", "user", ]


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
        

class ClientListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = ['name', 'email', 'phone_number', 'company_name', 'website', 'status', 'id', 'created_at']
        read_only_fields = ['id', 'status']


    

