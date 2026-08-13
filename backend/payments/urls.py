from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentProviderViewSet, PaymentTransactionViewSet, InitializePaymentView
from .webhooks import PaystackWebHook

router = DefaultRouter()
router.register(r'providers', PaymentProviderViewSet, basename='paymentprovider')
router.register(r'transactions', PaymentTransactionViewSet, basename='paymenttransaction')

urlpatterns = [
    path('paystack/webhook', PaystackWebHook.as_view(), name="paystack-webhook" ),
    path('initialize/', InitializePaymentView.as_view(), name="initialize-payment"),
    path('', include(router.urls)),
]