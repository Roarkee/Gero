from django.urls import path
from .views import *
urlpatterns = [
    path('invoice_intelligence/', InvoiceIntelligence.as_view(), name="inv-intelli")
]