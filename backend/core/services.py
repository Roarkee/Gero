from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.cache import cache
from.cache_keys import CacheKeys

token_generator = PasswordResetTokenGenerator()


def send_reset_password_email(email):
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return None

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)

    reset_link = f"https://177.0.0.1:5173/reset-password/{uid}/{token}/"

    send_mail(
        subject="Password Reset",
        message=f"Click the link to reset your password: {reset_link}",
        from_email="no-reply@yourapp.com",
        recipient_list=[email],
    )
    return reset_link


def reset_password(uidb64, token, new_password):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError):
        return None

    if token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return user
    return None





class CacheService:

    DEFAULT_TIMEOUT = 300

    @staticmethod
    def get(key, default=None):
        return cache.get(key, default)

    @staticmethod
    def set(key, value, timeout=None):
        if timeout is None:
            timeout = CacheService.DEFAULT_TIMEOUT

        cache.set(key, value, timeout)
        return value

    @staticmethod
    def delete(key):
        cache.delete(key)

    @staticmethod
    def exists(key):
        return cache.get(key) is not None

    @staticmethod
    def get_or_set(key, default, timeout=None):
        if timeout is None:
            timeout = CacheService.DEFAULT_TIMEOUT

        return cache.get_or_set(key, default, timeout)

    @staticmethod
    def clear():
        cache.clear()

    @staticmethod
    def invalidate_dashboard(user_id):
        key = CacheKeys.dashboard_stats(user_id)
        cache.delete(key)

    @staticmethod
    def invalidate_project(user_id, project_id):
        key = CacheKeys.project_stats(user_id, project_id)
        cache.delete(key)

    @staticmethod
    def invalidate_budget(user_id, budget_id):
        key = CacheKeys.budget_stats(user_id, budget_id)

        cache.delete(key)

    @staticmethod
    def invalidate_client_intelligence(user_id, client_id):
        key = CacheKeys.client_intelligence(
            user_id,
            client_id
        )

        cache.delete(key)

    @staticmethod
    def invalidate_notifications(user_id):
        key = CacheKeys.unread_notifications(user_id)
        cache.delete(key)




