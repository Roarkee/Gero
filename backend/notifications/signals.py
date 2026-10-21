from decimal import Decimal
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from payments.models import PaymentTransaction
from projects.models import Project, Task

from .services import create_notification


@receiver(post_save, sender=PaymentTransaction)
def notify_on_payment_success(sender, instance, created, **kwargs):
    if instance.status == 'completed' and not getattr(instance, '_notified', False):
        try:
            invoice = instance.invoice
            user = invoice.user if invoice else (instance.provider.user if instance.provider else None)
            if not user:
                return

            event_ref = instance.reference or instance.provider_reference or str(instance.id)
            event_key = f"payment_received:{event_ref}"

            # Format currency nicely
            curr = instance.currency or "GHS"
            currency_symbol = "GH₵" if curr in ["GHS", "GH₵"] else curr
            try:
                formatted_amount = f"{float(instance.amount):,.2f}"
            except (ValueError, TypeError):
                formatted_amount = str(instance.amount)

            client_name = invoice.client.name if (invoice and invoice.client) else "Customer"
            invoice_suffix = f" for invoice #{invoice.invoice_number}" if (invoice and invoice.invoice_number) else ""

            is_fully_paid = False
            if invoice and invoice.total_amount is not None:
                amount_paid_so_far = invoice.amount_paid or Decimal('0.00')
                if (amount_paid_so_far + instance.amount) >= invoice.total_amount:
                    is_fully_paid = True

            paid_suffix = " (Paid in full)" if is_fully_paid else ""
            title = "Payment Received"
            message = f"Received {currency_symbol} {formatted_amount} from {client_name}{invoice_suffix}{paid_suffix}."
            action_url = f"/invoices/{invoice.id}" if invoice else "/invoices"

            create_notification(
                user=user,
                event_key=event_key,
                notification_type='payment_received',
                title=title,
                message=message,
                action_url=action_url,
            )
            instance._notified = True  # Prevent duplicate notification for same memory instance
        except Exception:
            pass
