from notifications.models import Notification

def create_notification(user,type,title, message,action_url=None):
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        action_url=action_url
    )