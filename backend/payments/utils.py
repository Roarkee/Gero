import hmac
import hashlib
import json
from django.conf import settings

from django.utils import timezone
import uuid

def generate_reference():
    #my reference format is PI-yyyymmdd-hhmm-uuid(first 8 chars)
    return f'PI-{timezone.now().strftime("%Y%m%d-%H%M")}-{uuid.uuid4().hex[:8]}'


def verifyhook(raw_body, paystack_hash):
    from payments.models import PaymentTransaction
    try:
        payload = json.loads(raw_body)
        reference = payload.get("data", {}).get("reference")
        if not reference:
            return False, None
            
        transaction = PaymentTransaction.objects.get(reference=reference)
        provider = transaction.provider
    except (json.JSONDecodeError, PaymentTransaction.DoesNotExist):
        return False, None

    # Retrieve the raw secret string (encrypted_config is decrypted on access)
    secret = provider.encrypted_config
    if isinstance(secret, str):
        key = bytes(secret, encoding='UTF-8')
    else:
        key = secret

    # raw_body is expected to be bytes
    if isinstance(raw_body, str):
        raw_body = bytes(raw_body, encoding='UTF-8')

    my_hash = hmac.new(key, raw_body, hashlib.sha512).hexdigest()
    
    try:
        if hmac.compare_digest(my_hash, paystack_hash):
            return True, transaction
    except Exception as e:
        print("an error occcured during verification of paystack event", e)
    
    return False, None
