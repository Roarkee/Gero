from rest_framework import serializers
from client.models import Client
from projects.serializers import ProjectSerializer


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model= Client
        fields = ['id', 'name', 'email', 'phone_number','company_name']
        read_only_fields = ['id']

    def create(self, validated_data):
        # i'm assigning the user to the client to make sure that the client is created by the authenticated user
        user = self.context['request'].user
        client = Client.objects.create(user=user, **validated_data)
        return client
    

class ClientOverviewSerializier(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)#i'm specifying that the projects field
    #is a list by using many=True and also that it is read only
    class Meta:
        model=Client
        fields = ['name', 'projects']


    

