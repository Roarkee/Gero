from datetime import timedelta
from django.db.models import Count, Sum
from django.utils import timezone
from client.models import Client, ClientActivity


class ClientIntelligenceService:

    @staticmethod
    def get_days_since_contact(client):
        if not client.last_contacted_at:
            return None

        return (timezone.now() - client.last_contacted_at).days

    @staticmethod
    def get_days_in_status(client):
        return (timezone.now() - client.updated_at).days

    @staticmethod
    def get_relationship_health(client):

        score = 100
        reasons = []

        days_since_contact = (
            ClientIntelligenceService.get_days_since_contact(client)
        )

        # no contact
        if days_since_contact and days_since_contact > 30:
            score -= 35
            reasons.append("No contact in over 30 days")

        # overdue followup
        if (
            client.next_followup_at and
            client.next_followup_at < timezone.now()
        ):
            score -= 20
            reasons.append("Follow-up overdue")

        # waiting too long
        if (
            client.status == "waiting_on_client" and
            days_since_contact and
            days_since_contact > 7
        ):
            score -= 15
            reasons.append("Client inactive")

        # dormant/churned
        if client.status in ["dormant", "churned"]:
            score -= 40
            reasons.append("Dormant relationship")

        # high value bonus
        if client.lifetime_value > 5000:
            score += 10

        score = max(0, min(score, 100))

        if score >= 80:
            health = "healthy"
        elif score >= 50:
            health = "at_risk"
        else:
            health = "critical"

        return {
            "score": score,
            "status": health,
            "reasons": reasons
        }

    @staticmethod
    def get_attention_items(user):

        now = timezone.now()

        clients = Client.objects.filter(user=user)

        results = []

        for client in clients:

            reasons = []

            # overdue follow-up
            if (
                client.next_followup_at and
                client.next_followup_at < now
            ):
                reasons.append("Follow-up overdue")

            # proposal ignored
            if (
                client.status == "proposal_sent" and
                client.updated_at < now - timedelta(days=5)
            ):
                reasons.append("Proposal unanswered")

            # waiting too long
            if (
                client.status == "waiting_on_client" and
                client.updated_at < now - timedelta(days=7)
            ):
                reasons.append("Waiting on client too long")

            # dormant
            if (
                client.last_contacted_at and
                client.last_contacted_at < now - timedelta(days=30)
            ):
                reasons.append("Client becoming dormant")

            if reasons:
                results.append({
                    "id": client.id,
                    "name": client.name,
                    "status": client.status,
                    "reasons": reasons
                })

        return results

    @staticmethod
    def get_revenue_intelligence(user):

        clients = Client.objects.filter(
            user=user
        ).order_by("-lifetime_value")

        top_clients = []

        total_revenue = 0

        for client in clients:

            total_revenue += client.lifetime_value

            top_clients.append({
                "id": client.id,
                "name": client.name,
                "lifetime_value": float(client.lifetime_value)
            })

        return {
            "total_revenue": float(total_revenue),
            "top_clients": top_clients[:5]
        }

    @staticmethod
    def get_relationship_memory(client):

        activities = ClientActivity.objects.filter(
            client=client
        ).order_by("-created_at")[:10]

        memory = []

        for activity in activities:
            memory.append({
                "type": activity.activity_type,
                "description": activity.description,
                "created_at": activity.created_at
            })

        return memory

    @staticmethod
    def get_pipeline_intelligence(user):

        pipeline = (
            Client.objects.filter(user=user)
            .values("status")
            .annotate(total=Count("id"))
        )

        return pipeline

    @staticmethod
    def get_followups_due(user):

        now = timezone.now()

        clients = Client.objects.filter(
            user=user,
            next_followup_at__lte=now
        )

        followups = []

        for client in clients:
            followups.append({
                "id": client.id,
                "name": client.name,
                "next_followup_at": client.next_followup_at
            })

        return followups

    @staticmethod
    def get_client_segmentation(client):

        segment = []

        # high value
        if client.lifetime_value >= 10000:
            segment.append("high_value")

        # lead
        if client.status in [
            "lead",
            "inquiry",
            "negotiating"
        ]:
            segment.append("lead")

        # active
        if client.status == "active":
            segment.append("active_client")

        # dormant
        if client.status == "dormant":
            segment.append("dormant")

        # stalled
        if (
            client.status == "waiting_on_client" and
            client.updated_at < timezone.now() - timedelta(days=7)
        ):
            segment.append("stalled")

        return segment

    @staticmethod
    def get_full_client_intelligence(client):

        return {
            "relationship_health":
                ClientIntelligenceService.get_relationship_health(client),

            "relationship_memory":
                ClientIntelligenceService.get_relationship_memory(client),

            "segments":
                ClientIntelligenceService.get_client_segmentation(client),

            "days_since_contact":
                ClientIntelligenceService.get_days_since_contact(client),

            "days_in_status":
                ClientIntelligenceService.get_days_in_status(client),
        }

    @staticmethod
    def get_dashboard_intelligence(user):

        clients = Client.objects.filter(user=user)

        total_clients = clients.count()

        active_clients = clients.filter(
            status="active"
        ).count()

        dormant_clients = clients.filter(
            status="dormant"
        ).count()

        return {
            "attention_items":
                ClientIntelligenceService.get_attention_items(user),

            "revenue":
                ClientIntelligenceService.get_revenue_intelligence(user),

            "pipeline":
                ClientIntelligenceService.get_pipeline_intelligence(user),

            "followups_due":
                ClientIntelligenceService.get_followups_due(user),

            "stats": {
                "total_clients": total_clients,
                "active_clients": active_clients,
                "dormant_clients": dormant_clients,
            }
        }