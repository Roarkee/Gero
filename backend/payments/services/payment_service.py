from .paystack_service import PaystackProcessor
from ..models import PaymentTransaction, PaymentWebhook
from invoices.models import Invoice


def _log_audit(user, action, success=True, ip_address=None, user_agent=None, error_message='', details=None, webhook=None):
        from ..models import PaymentAuditLog #this would help avoid circular imports which is unlikely mmom but still
        return PaymentAuditLog.objects.create(
            user=user,
            action=action,
            success=success, 
            ip_address=ip_address,
            user_agent=user_agent,
            error_message=error_message,
            details=details,
            webhook=webhook
        )

class PaymentService:

    def __init__(self, processor):
        self.processor = processor

    def initialize(self, user, invoice, amount, currency, provider):
        
        # Determine fee dynamically or default to 0
        fee = 0
        
        transaction = PaymentTransaction(
            invoice=invoice,
            amount=amount,
            status='pending',
            fee=fee,
            provider=provider,
            currency=currency,
        )
        # save to generate reference and net_amount
        transaction.save()

        try:
            response_data = self.processor.initialize_payment(transaction, user)
            return response_data
        except Exception as e:
            # Optionally mark transaction as failed if initialization fails completely
            transaction.status = 'failed'
            transaction.save(update_fields=['status'])
            raise e


