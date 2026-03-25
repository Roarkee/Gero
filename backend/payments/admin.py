from django.contrib import admin
from payments.models import PaymentProvider,PaymentTransaction

# Register your models here.

admin.site.register(PaymentTransaction)
admin.site.register(PaymentProvider)

