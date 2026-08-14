from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Sum
from django.utils import timezone
from client.models import Client
from projects.models import Project



class Invoice(models.Model):

    class InvoiceStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        PARTLY_PAID = 'partly_paid', 'Partly_Paid'
        OVERDUE = 'overdue', 'Overdue'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='invoices')
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name='invoices', null=True, blank=True)
    payment_provider = models.ManyToManyField("payments.PaymentProvider",related_name='invoices', blank=True)
    sequence_number = models.PositiveIntegerField()
    invoice_number = models.CharField(max_length=50, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'issue_date']),
            models.Index(fields=['due_date']),
        ]

        constraints = [
            models.UniqueConstraint(fields=['user', 'invoice_number'], name='invoice_number_unique_per_user'),

            models.UniqueConstraint(fields=['user', 'sequence_number'], name='invoice_sequence_unique_per_user')
        ]

    def __str__(self):
        return f'{self.invoice_number} - {self.client.name}'

    def clean(self):

        if self.client.user != self.user:
            raise ValidationError('Client must belong to the same user.')

        if self.project and self.project.user != self.user:
            raise ValidationError('Project must belong to the same user.')

        if self.project and self.project.client != self.client:
            raise ValidationError('Project client must match invoice client.')

        if self.due_date < self.issue_date:
            raise ValidationError('Due date cannot be before issue date.')

    @property
    def is_finalized(self):
        return self.status in [
            self.InvoiceStatus.SENT,
            self.InvoiceStatus.PAID,
            self.InvoiceStatus.OVERDUE,
            self.InvoiceStatus.PARTLY_PAID
        ]

    def recalculate_totals(self):
        subtotal = (
            self.items.aggregate(total=Sum('amount'))['total']
            or Decimal('0.00')
        ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        self.subtotal = subtotal

        self.tax_amount = (
            (subtotal * self.tax_rate)
            / Decimal('100.00')
        ).quantize(
            Decimal('0.01'),
            rounding=ROUND_HALF_UP
        )

        self.total_amount = (
            subtotal + self.tax_amount
        ).quantize(
            Decimal('0.01'),
            rounding=ROUND_HALF_UP
        )

    def generate_invoice_number(self):
        year = self.issue_date.year
        self.invoice_number = f'INV-{year}-{self.sequence_number:04d}'

    def save(self, *args, **kwargs):
        # invoice 3
        if self.pk:
            original = Invoice.objects.get(pk=self.pk)
            # need to take a look at the state machine 
            if original.is_finalized:
                allowed_statuses = [
                    self.InvoiceStatus.DRAFT,
                    self.InvoiceStatus.PAID,
                    self.InvoiceStatus.OVERDUE,
                    self.InvoiceStatus.PARTLY_PAID
                ]

                if self.status != original.status:
                    if self.status not in allowed_statuses:
                        raise ValidationError('Invalid finalized invoice status change.')

                protected_fields = [
                    'client_id',
                    'project_id',
                    'subtotal',
                    'tax_rate',
                    'tax_amount',
                    'total_amount',
                    'issue_date',
                    'invoice_number',
                    'sequence_number',
                ]

                for field in protected_fields:
                    if getattr(self, field) != getattr(original, field):
                        raise ValidationError('Finalized invoices cannot be modified.')
        # this is not fully handle concurrency 
        # so i'd have to come and figure a way to generate invoice numbers better
        if not self.pk:
            with transaction.atomic():
                last_sequence = (
                    Invoice.objects
                    .select_for_update()
                    .filter(user=self.user)
                    .aggregate(max_sequence=models.Max('sequence_number'))['max_sequence']
                    or 0
                )

                self.sequence_number = last_sequence + 1
                self.generate_invoice_number()
                
                self.full_clean()
                super().save(*args, **kwargs)
                return
            
        

        self.recalculate_totals()
        self.full_clean()

        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1.00'))
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    time_entries = models.ManyToManyField('projects.TimeEntry', blank=True)
    class Meta:

        indexes = [
            models.Index(fields=['invoice']),
        ]

    def __str__(self):
        return f'{self.description} ({self.invoice.invoice_number})'

    def clean(self):
        if self.invoice.is_finalized:
            raise ValidationError('Cannot modify items on finalized invoices.')

        if self.quantity <= 0:
            raise ValidationError('Quantity must be greater than zero.')

        if self.rate < 0:
            raise ValidationError('Rate cannot be negative.')

    def calculate_amount(self):
        return (
            self.quantity * self.rate
        ).quantize(
            Decimal('0.01'),
            rounding=ROUND_HALF_UP
        )

    def save(self, *args, **kwargs):
        self.full_clean()
        self.amount = self.calculate_amount()
        with transaction.atomic():
            super().save(*args, **kwargs)
            self.invoice.recalculate_totals()
            self.invoice.save()

    def delete(self, *args, **kwargs):
        if self.invoice.is_finalized:
            raise ValidationError('Cannot delete items from finalized invoices.')
        invoice = self.invoice

        with transaction.atomic():
            super().delete(*args, **kwargs)
            invoice.recalculate_totals()
            invoice.save()

class InvoicePayment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments_received')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    method = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f'{self.amount} for {self.invoice.invoice_number}'

    def save(self, *args, **kwargs):
        with transaction.atomic():
            super().save(*args, **kwargs)
            total_paid = self.invoice.payments_received.aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
            self.invoice.amount_paid = total_paid
            
            if total_paid >= self.invoice.total_amount:
                if self.invoice.status != Invoice.InvoiceStatus.PAID:
                    self.invoice.status = Invoice.InvoiceStatus.PAID
                    self.invoice.paid_date = self.payment_date
                    self.invoice.save(update_fields=['status', 'paid_date', 'amount_paid'])
                else:
                    self.invoice.save(update_fields=['amount_paid'])
            else:
                if total_paid > Decimal('0.00') and self.invoice.status != Invoice.InvoiceStatus.PARTLY_PAID:
                    self.invoice.status = Invoice.InvoiceStatus.PARTLY_PAID
                    self.invoice.save(update_fields=['status', 'amount_paid'])
                else:
                    self.invoice.save(update_fields=['amount_paid'])
