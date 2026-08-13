from django.db import models
from django.contrib.auth.models import AbstractBaseUser,BaseUserManager, PermissionsMixin


# Create your models here.

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set.')
        email = self.normalize_email(email)# it removes extra space and makes the email lowercase
        user = self.model(email=email, **extra_fields)#self.model creates a new instance of the db model in which case it's the user model
        user.set_password(password)#this function hashes the password
        user.save(using=self._db)#this makes sure the user is saved to the db using the current database connection
        return user  
        
        


    def create_superuser(self, email, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    PROVIDERS = (
        ('email', 'Email'),
        ('google', 'Google'),
    )
    ROLE_CHOICES = (
        ('freelancer', 'Freelancer'),
        ('client', 'Client'),
    )
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    password = models.CharField(max_length=128)
    provider = models.CharField(max_length=30, blank=True, choices=PROVIDERS, default='email')
    provider_id = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='freelancer')
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()


    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} + {self.last_name}"
    

    
    

