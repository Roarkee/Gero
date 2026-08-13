from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from users.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone


class UserSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True)
    has_client_portal = serializers.SerializerMethodField()
    has_freelancer_portal = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_client', 'is_freelancer', 'password', 'date_joined', 'has_client_portal', 'has_freelancer_portal']
        read_only_fields = ['id', 'date_joined']

    def get_has_client_portal(self, obj):
        from client.models import Client
        return Client.objects.filter(user_account=obj).exclude(user=obj).exists() or \
               Client.objects.filter(email__iexact=obj.email).exclude(user=obj).exists()
               
    def get_has_freelancer_portal(self, obj):
        return obj.is_freelancer

    def create(self, validated_data):
        user = User.objects.create_user(#this makes sure it uses the create_user method in the usermanager to hash the password 
            email=validated_data['email'],#before saving to db
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
    
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['email'] = user.email
        token['first_name'] = user.first_name

        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        self.user.last_login = timezone.now()
        self.user.save(update_fields = ['last_login'])
        return data