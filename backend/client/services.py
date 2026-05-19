from datetime import timedelta
from django.db.models import Count, Sum
from django.utils import timezone
from .models import Client, ClientActivity


class ActivityLoggingService:
    @staticmethod
    def log_activity(client, user, activity_type, description, metadata=None):
        if metadata is None:
            metadata = {}
        return ClientActivity.objects.create(
            client=client,
            user=user,
            activity_type=activity_type,
            description=description,
            metadata=metadata
        )


class HealthScoringEngine:
    @staticmethod
    def get_days_since_contact(client):
        if not client.last_contacted_at:
            return None
        return (timezone.now() - client.last_contacted_at).days

    @staticmethod
    def calculate_health(client):
        score = 100
        reasons = []

        days_since_contact = HealthScoringEngine.get_days_since_contact(client)

        # no contact
        if days_since_contact and days_since_contact > 30:
            score -= 35
            reasons.append("No contact in over 30 days")

        # overdue followup
        if client.next_followup_at and client.next_followup_at < timezone.now():
            score -= 20
            reasons.append("Follow-up overdue")

        # waiting too long
        if client.status == "waiting_on_client" and days_since_contact and days_since_contact > 7:
            score -= 15
            reasons.append("Client inactive while waiting on them")

        # dormant/churned
        if client.status in ["dormant", "churned"]:
            score -= 40
            reasons.append("Dormant relationship")

        # high value bonus
        if client.lifetime_value > 5000:
            score += 10
            reasons.append("High value client bonus")

        score = max(0, min(score, 100))

        if score >= 80:
            health = "healthy"
        elif score >= 50:
            health = "stable"
        elif score >= 30:
            health = "at_risk"
        else:
            health = "critical"

        return score, health, reasons


class AttentionEngine:
    @staticmethod
    def calculate_attention_required(client):
        now = timezone.now()
        reasons = []
        requires_attention = False

        if client.next_followup_at and client.next_followup_at < now:
            requires_attention = True
            reasons.append("Follow-up overdue")

        if client.status == "proposal_sent" and client.updated_at < now - timedelta(days=5):
            requires_attention = True
            reasons.append("Proposal unanswered for 5+ days")

        if client.status == "waiting_on_client" and client.updated_at < now - timedelta(days=7):
            requires_attention = True
            reasons.append("Waiting on client for 7+ days")

        if client.last_contacted_at and client.last_contacted_at < now - timedelta(days=30):
            requires_attention = True
            reasons.append("No contact in 30 days")
            
        return requires_attention, reasons

    @staticmethod
    def update_attention_flags(client):
        requires_attention, reasons = AttentionEngine.calculate_attention_required(client)
        if client.attention_required != requires_attention:
            client.attention_required = requires_attention
            # Avoid infinite loops, we just update the field, don't call save()
            # If we call save(), signal triggers again. 
            # We'll use update() or rely on the periodic task to do bulk updates.
            Client.objects.filter(pk=client.pk).update(attention_required=requires_attention)
        return requires_attention, reasons


class FollowUpEngine:
    @staticmethod
    def get_overdue_followups(user):
        now = timezone.now()
        return Client.objects.filter(user=user, next_followup_at__lt=now).order_by('next_followup_at')