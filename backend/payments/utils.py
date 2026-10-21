import hmac
import hashlib
import json
from django.conf import settings
from django.utils import timezone
import uuid

def generate_reference():
    # My reference format is PI-yyyymmdd-hhmm-uuid(first 8 chars)
    return f'PI-{timezone.now().strftime("%Y%m%d-%H%M")}-{uuid.uuid4().hex[:8]}'


def verifyhook(raw_body, paystack_hash):
    from payments.models import PaymentTransaction, PaymentProvider
    
    try:
        if isinstance(raw_body, bytes):
            body_str = raw_body.decode('utf-8')
        else:
            body_str = str(raw_body)
        payload = json.loads(body_str)
    except Exception:
        return False, None

    reference = payload.get("data", {}).get("reference")
    transaction = None
    provider = None

    if reference:
        try:
            transaction = PaymentTransaction.objects.get(reference=reference)
            provider = transaction.provider
        except PaymentTransaction.DoesNotExist:
            transaction = None

    # Retrieve secret key
    secret = None
    if provider:
        try:
            config = json.loads(provider.encrypted_config)
            secret = config.get("secret_key", "")
        except Exception:
            secret = provider.encrypted_config

    if not secret:
        # Fallback to active Paystack provider in DB
        active_provider = PaymentProvider.objects.filter(provider="paystack", is_active=True).first()
        if active_provider:
            try:
                config = json.loads(active_provider.encrypted_config)
                secret = config.get("secret_key", "")
            except Exception:
                secret = active_provider.encrypted_config

    if not secret:
        # Fallback to settings / env
        secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '')

    if not secret:
        return False, None

    if isinstance(secret, str):
        key = bytes(secret, encoding='UTF-8')
    else:
        key = secret

    if isinstance(raw_body, str):
        raw_body_bytes = bytes(raw_body, encoding='UTF-8')
    else:
        raw_body_bytes = raw_body

    my_hash = hmac.new(key, raw_body_bytes, hashlib.sha512).hexdigest()

    try:
        if hmac.compare_digest(my_hash, paystack_hash):
            return True, transaction
    except Exception as e:
        print("An error occurred during verification of Paystack event:", e)

    return False, None
