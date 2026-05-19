from celery import shared_task
from django.utils import timezone
from .models import Client
from .services import HealthScoringEngine, AttentionEngine
from .selectors import get_client_segmentation

@shared_task
def update_client_intelligence_daily():
    """
    Periodic task to recalculate health scores, attention flags, 
    and dormant statuses for all clients.
    """
    clients = Client.objects.all()
    now = timezone.now()

    for client in clients:
        changed = False

        # 1. Update Health Score
        score, health_label, _ = HealthScoringEngine.calculate_health(client)
        if client.health_score != score or client.health_label != health_label:
            client.health_score = score
            client.health_label = health_label
            changed = True

        # 2. Update Attention Required
        requires_attention, _ = AttentionEngine.calculate_attention_required(client)
        if client.attention_required != requires_attention:
            client.attention_required = requires_attention
            changed = True

        # 3. Update Dormant Status
        segments = get_client_segmentation(client)
        if 'dormant' in segments and client.status != 'dormant':
            client.status = 'dormant'
            client.dormant_since = now
            changed = True
        elif 'dormant' not in segments and client.status == 'dormant':
            # This would require more complex logic to know what it was before,
            # but for now, we leave it dormant until user manually changes it back.
            pass

        if changed:
            client.save(update_fields=['health_score', 'health_label', 'attention_required', 'status', 'dormant_since'])
