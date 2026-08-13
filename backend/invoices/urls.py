from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, InvoiceItemViewSet, InvoicePaymentViewSet, PublicInvoiceView

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'invoice-items', InvoiceItemViewSet, basename='invoiceitem')
router.register(r'invoice-payments', InvoicePaymentViewSet, basename='invoicepayment')

urlpatterns = [
    path('invoices/public/<int:pk>/', PublicInvoiceView.as_view(), name='public-invoice-detail'),
    path('', include(router.urls)),
]