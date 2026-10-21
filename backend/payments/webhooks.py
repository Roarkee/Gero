from rest_framework.response import Response
from .utils import verifyhook
from rest_framework import views
from payments.models import PaymentTransaction, PaymentAuditLog, PaymentWebhook
from django.db.models import Sum
from decimal import Decimal
from django.db import transaction
import json

class PaystackWebHook(views.APIView):
    '''Receives webhook events from Paystack, verifies signatures, and processes payments idempotently.'''
    
    def get(self, request):
        return Response("I am Unstoppable")
    
    def post(self, request, *args, **kwargs):
        hashbody = request.headers.get('x-paystack-signature')
        if not hashbody:
            return Response("Missing x-paystack-signature header", status=400)

        raw_body = request.body
        is_verified, tx = verifyhook(raw_body, hashbody)

        if not is_verified:
            PaymentAuditLog.objects.create(
                action=PaymentAuditLog.PaymentAuditAction.WEBHOOK_SIGNATURE_FAILED,
                success=False,
                details={"signature": hashbody}
            )
            return Response("Invalid signature", status=400)

        payload = json.loads(raw_body)

        # If valid test webhook or event without local transaction (e.g. Paystack Dashboard test event)
        if not tx:
            return Response({"status": "verified", "message": "Test webhook verified successfully."}, status=200)

        # Save webhook for audit
        webhook = PaymentWebhook.objects.create(
            provider=tx.provider,
            event_type=payload.get('event'),
            payload=payload,
            headers=dict(request.headers),
            signature_verified=True,
            transaction=tx
        )

        if payload.get('event') == "charge.success":
            with transaction.atomic():
                # Lock transaction to prevent race conditions
                tx = PaymentTransaction.objects.select_for_update().get(id=tx.id)
                
                if tx.status == 'completed':
                    # Idempotent - already processed
                    PaymentAuditLog.objects.create(
                        action=PaymentAuditLog.PaymentAuditAction.DUPLICATE_WEBHOOK,
                        success=True,
                        webhook=webhook,
                        details={"reference": tx.reference}
                    )
                    return Response(status=200)

                paystack_amount = payload.get("data", {}).get("amount", 0)
                # Paystack amount is in pesewas (amount * 100)
                expected_amount = int(tx.amount * 100)
                
                if paystack_amount != expected_amount:
                    tx.status = 'failed'
                    tx.gateway_response = payload
                    tx.save(update_fields=['status', 'gateway_response'])
                    PaymentAuditLog.objects.create(
                        action=PaymentAuditLog.PaymentAuditAction.PAYMENT_REJECTED,
                        success=False,
                        webhook=webhook,
                        error_message="Amount mismatch",
                        details={"expected": expected_amount, "received": paystack_amount}
                    )
                    return Response("Amount mismatch", status=400)

                tx.status = 'completed'
                tx.gateway_response = payload
                tx.provider_reference = payload.get("data", {}).get("id") # Paystack internal id
                tx.save(update_fields=['status', 'gateway_response', 'provider_reference'])
                
                # Lock invoice for safe balance calculation
                invoice = tx.invoice
                invoice = invoice.__class__.objects.select_for_update().get(id=invoice.id)
                
                received = PaymentTransaction.objects.filter(
                    invoice=invoice, status='completed'
                ).aggregate(sum=Sum('amount'))['sum'] or Decimal("0.00")
                
                invoice.amount_paid = received
                
                if received >= invoice.total_amount:
                    invoice.status = 'paid'
                else:
                    invoice.status = 'partly_paid'
                    
                invoice.save(update_fields=['amount_paid', 'status'])
                
                # Create InvoicePayment so that dashboard metrics account for this payment
                from invoices.models import InvoicePayment
                from django.utils import timezone
                InvoicePayment.objects.create(
                    invoice=invoice,
                    amount=tx.amount,
                    payment_date=timezone.now().date(),
                    method=tx.provider.provider if tx.provider else 'paystack',
                    notes=f"Gateway Payment Ref: {tx.reference}"
                )
                
                PaymentAuditLog.objects.create(
                    action=PaymentAuditLog.PaymentAuditAction.PAYMENT_VERIFIED,
                    success=True,
                    webhook=webhook,
                    details={"invoice_status": invoice.status, "amount_paid": str(received)}
                )

        webhook.processed = True
        webhook.save(update_fields=['processed'])
        return Response(status=200)
