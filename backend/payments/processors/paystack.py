import paystack
from django.conf import settings
from .base import BasePaymentProcessor
import requests

class PaystackProcessor(BasePaymentProcessor):
    BASE_URL = "https://api.paystack.co"

    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }
    
    def initialize_payment(self, intent):
        payload = {
            "email": intent.invoice.client.email,
            "amount": int(intent.invoice.amount * 100), #need to convert to pesewas 
            "reference": intent.invoice.reference,
            "currency": intent.invoice.currency
        }

        response = requests.post(
            f"{self.BASE_URL}/transaction/initialize/",
            json=payload,
            timeout=20,
            headers=self.headers
        )

        response.raise_for_status()

        return response.json()

    def verify_payment(self, reference):
        
        response = requests.get(
            f"{self.BASE_URL}/transaction/verify/{reference}",
            headers=self.headers,
            timeout=20
        )
        response.raise_for_status()

        return response.josn()