from django.db import models
from django.conf import settings

# Create your models here.
class Client(models.Model):
    STATUS =[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('completed', 'Completed'),
            ('pending', 'Pending')
        ]
    
    user= models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='clients')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    company_name= models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive'),('completed', 'Completed'), ('pending', 'Pending')], default='active')
    address = models.CharField(max_length=200, blank=True, null=True)
    note = models.CharField(max_length=200, blank=True, null=True)
    default_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    billing_currency = models.CharField(max_length=3, default='USD')
    billing_address = models.TextField(blank=True, null=True)
    def __str__(self):
        return self.name
