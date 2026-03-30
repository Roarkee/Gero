from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from encrypted_model_fields.fields import EncryptedCharField
import uuid
# Create your models here.

#this is a manager to help me query test and live payment providers
class PaymentProviderManager(models.Manager):
    #this returns both test and live
    def active(self):
        return self.filter(is_active=True)
    #this return only test
    def live(self):
        return self.filter(is_active=True, is_test_mode=False)    

#model to store different payment gateways. 
class PaymentProvider(models.Model):


    PROVIDER_CHOICES = [
        ('flutterwave', 'Flutterwave'),
        ('hubtel', 'Hubtel'),
        ('mtn_momo', 'MTN Mobile Money'),
        ('vodafone_cash', 'Vodafone Cash'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_providers'
    )
    provider_type = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    display_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_test_mode = models.BooleanField(default=True)

     #stores secret data from the payemnt gateways like api keys
     #it is from fernet fields and automatically encrypts. i believe it is field level encryption
    encrypted_config = EncryptedCharField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PaymentProviderManager()

    class Meta:
        unique_together = ('user', 'provider_type', 'display_name')
        indexes = [
            models.Index(fields=['user', 'provider_type']),
            models.Index(fields=['is_active']),
        ]
        verbose_name = "Payment Provider"
        verbose_name_plural = "Payment Providers"

    def __str__(self):
        return f"{self.display_name} ({self.get_provider_type_display()})"
    

#this is similar to what instagram does with uploading pictures. so once you're in the process of creating
#an invoice, a payment intent is created. and this intent is updated as the payment process goes on
class PaymentIntent(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
        ('expired', 'Expired'),
        ('refunded', 'Refunded')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_intents')
    invoice_id = models.ForeignKey('invoices.Invoice', on_delete=models.CASCADE, related_name='payment_intent')
    provider = models.ForeignKey(PaymentProvider, on_delete=models.CASCADE, related_name='payment_intents')
    currency = models.CharField(max_length=3, default='GHS')
    amount = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(1.00)])
    reference = models.CharField(max_length=100, unique=True, editable=False, default='utils.generate_reference')
    external_reference = models.CharField(max_length=150, blank=True, null=True)
    status = models.CharField(choices=STATUS_CHOICES, default='pending', max_length=12)
    payment_url = models.URLField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()


    class Meta:
        indexes = [
            models.Index(fields=['reference']),
            models.Index(fields=['external_reference']),
            models.Index(fields=['status', 'created_at']),
        ]


#this stores the actual transactions that happen. the intent might go through many transacs
class PaymentTransaction(models.Model):
    TRANSACTION_TYPES = [('credit', 'Credit'),
                         ('debit', 'Debit'),
                         ('income', 'Income'),
                   
                         ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
        ('refunded', 'Refunded')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_intent = models.ForeignKey(PaymentIntent, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(3.00)])
    status = models.CharField(choices=STATUS_CHOICES, default='pending', max_length=12)
    fee = models.DecimalField(max_digits=12, decimal_places=2, default=1.5)
    net_amount = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(1.00)])
    external_transaction_id = models.CharField(max_length=150, blank=True, null=True)
    processed_at =models.DateTimeField()
    created_at =models.DateTimeField(auto_now_add=True)
    gateway_response = models.JSONField()

    class Meta: 
        indexes = [
            models.Index(fields=[ 'external_transaction_id', 'processed_at']),
            models.Index(fields=['processed_at'])
        ]
        verbose_name= 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.status == 'completed':
            invoice = self.payment_intent.invoice_id
            if invoice:
                from django.db.models import Sum
                # Sum all completed transactions for all intents related to this invoice
                total_paid = getattr(invoice, 'total_paid', 0) # fallback
                # Wait, the intent links directly to invoice_id
                # Let's aggregate via transactions
                total_paid = PaymentTransaction.objects.filter(
                    payment_intent__invoice_id=invoice,
                    status='completed',
                    transaction_type__in=['credit', 'income']
                ).aggregate(total=Sum('amount'))['total'] or 0

                if total_paid >= invoice.total_amount:
                    invoice.status = 'paid'
                    invoice.save(update_fields=['status'])

#responses/notifications gotten from the providers basically
class PaymentWebhook(models.Model):
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider_type = models.CharField(max_length=20)
    event_type = models.CharField(max_length=50)
    payload = models.JSONField()
    headers = models.JSONField()
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['provider_type', 'processed']),
            models.Index(fields=['created_at']),
        ]

#i am my own auitor here. this will log every thing that happens in the process
class PaymentAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook = models.ForeignKey(
        'PaymentWebhook',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )

    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_audit_logs'
    )
    #what action did the server take? was a refund given? payment canceled? what?
    action = models.CharField(max_length=100)
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)#this stores the browser or app details 
    details = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['action', 'success']),
            models.Index(fields=['created_at']),
            models.Index(fields=['ip_address']),
        ]
        verbose_name = "Payment Audit Log"
        verbose_name_plural = "Payment Audit Logs"

    def __str__(self):
        return f"{self.action} by {self.user or 'system'} - {'OK' if self.success else 'FAILED'}"
