
from django.conf import settings
from ..processors.base import BasePaymentProcessor
import requests
from django.contrib.auth import get_user_model
from payments.models import PaymentProvider

class PaystackProcessor(BasePaymentProcessor):
    BASE_URL = "https://api.paystack.co"

    def __init__(self, provider):
        import json
        self.provider = provider
        # Retrieve the secret string (ensure it is decrypted)
        try:
            config = json.loads(self.provider.encrypted_config)
            secret = config.get("secret_key", "")
        except Exception:
            secret = self.provider.encrypted_config
            
        self.headers = {
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
        }
    
    def initialize_payment(self, transaction,user):
        payload = {
            "email": user.email,
            "amount": int(transaction.amount * __import__('decimal').Decimal('100')), #need to convert to pesewas 
            "reference": transaction.reference,
            "currency": transaction.currency,
            "channels": ["bank","card", "mobile_money"],
            "callback_url": "",
            
        }

        response = requests.post(
            f"{self.BASE_URL}/transaction/initialize/",
            json=payload,
            timeout=20,
            headers=self.headers
        )

        response.raise_for_status()
        #there'll be an access code provided in the data object that would be needed to complete the 
        #transaction
        return response.json()

    def verify_payment(self, reference):
        
        response = requests.get(
            f"{self.BASE_URL}/transaction/verify/{reference}",
            headers=self.headers,
            timeout=20
        )
        response.raise_for_status()

        return response.json()


    