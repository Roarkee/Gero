from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import PaymentProvider, PaymentTransaction
from invoices.models import Invoice
from .serializers import PaymentProviderSerializer
from .services.payment_service import PaymentService
from .processors.factory import PaymentProcessorFactory

class PaymentProviderViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentProviderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict queryset to request.user only
        user = self.request.user
        return PaymentProvider.objects.filter(user = user)

    def perform_create(self, serializer):
        # Automatically attach the user to the provider
        serializer.save(user=self.request.user)

class PaymentTransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return PaymentTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InitializePaymentView(views.APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        invoice_id = request.data.get('invoice_id')
        amount_str = request.data.get('amount')
        
        if not invoice_id or not amount_str:
            return Response({"error": "invoice_id and amount are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = Decimal(amount_str)
        except Exception:
            return Response({"error": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)
            
        if amount <= Decimal('0.00'):
            return Response({"error": "Amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        invoice = get_object_or_404(Invoice, id=invoice_id)
        
        # Calculate remaining balance
        remaining_balance = invoice.total_amount - invoice.amount_paid
        if remaining_balance <= Decimal('0.00'):
            return Response({"error": "Invoice is already paid in full."}, status=status.HTTP_400_BAD_REQUEST)
            
        if amount > remaining_balance:
            return Response({"error": "Amount exceeds the remaining balance."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get Paystack provider for this invoice
        provider = invoice.payment_provider.filter(provider="paystack", is_active=True).first()
        if not provider:
            # Fallback to the freelancer's active paystack provider if not explicitly linked
            provider = PaymentProvider.objects.filter(user=invoice.user, provider="paystack", is_active=True).first()
            
        if not provider:
            return Response({"error": "The freelancer has not configured an available payment provider for this invoice."}, status=status.HTTP_400_BAD_REQUEST)

        # We need a user to pass to initialize_payment.
        # Since it's public access, we use the invoice's client user if available, or just the client email
        # Paystack needs an email.
        class DummyUser:
            pass
        payer = DummyUser()
        payer.email = invoice.client.email if hasattr(invoice.client, 'email') and invoice.client.email else invoice.user.email

        processor = PaymentProcessorFactory.get_processor(provider)
        service = PaymentService(processor)
        
        try:
            response_data = service.initialize(
                user=payer,
                invoice=invoice,
                amount=amount,
                currency="GHS", # Defaulting to GHS as per original code, could be dynamic
                provider=provider
            )
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




        