from notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

user = User.objects.get(email = 'user0@example.com')

Notification.objects.create(
    user=user,
    type="payment_received",
    title="Payment Received",
    message="You received GHS 500.",
    action_url="/invoices/123"
)