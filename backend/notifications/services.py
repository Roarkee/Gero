from notifications.models import Notification


def create_notification(user,notification_type,title, message, event_key, action_url=None):
    from notifications.tasks import send_notifications_task
    notification, created =  Notification.objects.get_or_create(
        user=user,
        event_key=event_key,
        defaults={
            'type': notification_type,
            'title': title,
            'message': message,
            'action_url': action_url,
        }
    )
    if created:
        from django.db import transaction
        transaction.on_commit(lambda: send_notifications_task.delay(notification.id))

    return notification
