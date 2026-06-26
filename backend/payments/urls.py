from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentProviderViewSet

router = DefaultRouter()
router.register(r'providers', PaymentProviderViewSet, basename='paymentprovider')

urlpatterns = [
    path('', include(router.urls)),
]