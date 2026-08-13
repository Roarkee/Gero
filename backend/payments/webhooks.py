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
            return Response("we couldn't get anywhere",status=400)

        raw_body = request.body
        is_verified, tx = verifyhook(raw_body, hashbody)

        if not is_verified or not tx:
            PaymentAuditLog.objects.create(
                action=PaymentAuditLog.PaymentAuditAction.WEBHOOK_SIGNATURE_FAILED,
                success=False,
                details={"signature": hashbody}
            )
            return Response(status=400)

        payload = json.loads(raw_body)
        
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
                    return Response("we were auditing and failed", status=400)

                tx.status = 'completed'
                tx.gateway_response = payload
                tx.provider_reference = payload.get("data", {}).get("id") # paystack internal id
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
                
                PaymentAuditLog.objects.create(
                    action=PaymentAuditLog.PaymentAuditAction.PAYMENT_VERIFIED,
                    success=True,
                    webhook=webhook,
                    details={"invoice_status": invoice.status, "amount_paid": str(received)}
                )

        webhook.processed = True
        webhook.save(update_fields=['processed'])
        return Response(status=200)
