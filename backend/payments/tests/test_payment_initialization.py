import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from decimal import Decimal
import json

from invoices.models import Invoice
from payments.models import PaymentProvider, PaymentTransaction
from client.models import Client
from projects.models import Project
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def freelancer():
    user = User.objects.create_user(email="freelancer@test.com", password="password123")
    return user

@pytest.fixture
def client_obj(freelancer):
    return Client.objects.create(user=freelancer, name="Test Client", email="client@test.com")

@pytest.fixture
def invoice(freelancer, client_obj):
    now = timezone.now()
    invoice = Invoice.objects.create(
        user=freelancer,
        client=client_obj,
        issue_date=now.date(),
        due_date=(now + timedelta(days=30)).date(),
        total_amount=Decimal('100.00'),
        amount_paid=Decimal('0.00'),
        sequence_number=1,
    )
    return invoice

@pytest.fixture
def active_paystack_provider(freelancer):
    config = json.dumps({"secret_key": "sk_test_12345"})
    provider = PaymentProvider.objects.create(
        user=freelancer,
        provider="paystack",
        display_name="My Paystack",
        is_active=True,
        is_test_mode=True,
        encrypted_config=config
    )
    return provider

@pytest.mark.django_db
class TestPaymentInitialization:
    
    def test_initialize_payment_active_provider(self, api_client, invoice, active_paystack_provider, mocker):
        # Mock requests.post to Paystack API
        mock_response = mocker.Mock()
        mock_response.json.return_value = {
            "status": True,
            "message": "Authorization URL created",
            "data": {
                "authorization_url": "https://checkout.paystack.com/test",
                "access_code": "test_access_code",
                "reference": "test_ref"
            }
        }
        mock_response.raise_for_status.return_value = None
        mocker.patch('requests.post', return_value=mock_response)

        url = reverse('initialize-payment')
        data = {
            'invoice_id': invoice.id,
            'amount': '100.00'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] is True
        assert 'authorization_url' in response.data['data']

        # Ensure transaction was created correctly
        transaction = PaymentTransaction.objects.get(invoice=invoice)
        assert transaction.amount == Decimal('100.00')
        assert transaction.currency == 'GHS'
        assert transaction.provider == active_paystack_provider

    def test_initialize_payment_no_provider(self, api_client, invoice):
        # Freelancer has NO payment providers at all
        url = reverse('initialize-payment')
        data = {
            'invoice_id': invoice.id,
            'amount': '100.00'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "freelancer has not configured an available payment provider" in response.data['error']

    def test_initialize_payment_inactive_provider(self, api_client, invoice, active_paystack_provider):
        # Deactivate the provider
        active_paystack_provider.is_active = False
        active_paystack_provider.save()

        url = reverse('initialize-payment')
        data = {
            'invoice_id': invoice.id,
            'amount': '100.00'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "freelancer has not configured an available payment provider" in response.data['error']

    def test_initialize_payment_partial_payment(self, api_client, invoice, active_paystack_provider, mocker):
        mock_response = mocker.Mock()
        mock_response.json.return_value = {"status": True, "data": {"authorization_url": "url", "access_code": "acc"}}
        mocker.patch('requests.post', return_value=mock_response)

        url = reverse('initialize-payment')
        # Invoice total is 100, try paying 50
        data = {
            'invoice_id': invoice.id,
            'amount': '50.00'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        transaction = PaymentTransaction.objects.get(invoice=invoice)
        assert transaction.amount == Decimal('50.00')

    def test_initialize_payment_exceeds_balance(self, api_client, invoice, active_paystack_provider):
        url = reverse('initialize-payment')
        # Invoice total is 100, try paying 150
        data = {
            'invoice_id': invoice.id,
            'amount': '150.00'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Amount exceeds the remaining balance" in response.data['error']

    def test_get_payment_providers_hides_secrets(self, api_client, freelancer, active_paystack_provider):
        api_client.force_authenticate(user=freelancer)
        url = reverse('paymentprovider-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        
        provider_data = response.data[0]
        # Serializer includes encrypted_config, which might be a problem if it exposes the raw string directly
        # However, fernet fields return the encrypted string, NOT the decrypted one, unless explicitly decrypted.
        config_str = provider_data.get('encrypted_config', '')
        # Check that the raw secret key is NOT in the response
        assert "sk_test_12345" not in config_str
