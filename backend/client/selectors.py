from datetime import timedelta
from decimal import Decimal
from django.db.models import Count, Sum
from django.utils import timezone
from .models import Client, ClientActivity
from .services import HealthScoringEngine, AttentionEngine


def get_client_segmentation(client):
    segment = []
    
    # high value
    if client.lifetime_value >= 10000:
        segment.append("high_value")
    
    # lead
    if client.status in ["lead", "inquiry", "negotiating"]:
        segment.append("lead")
    
    # active
    if client.status == "active":
        segment.append("active_client")
    
    # dormant
    if client.status == "dormant":
        segment.append("dormant")
    
    # stalled
    if client.status == "waiting_on_client" and client.updated_at < timezone.now() - timedelta(days=7):
        segment.append("stalled")
    
    return segment

def get_pipeline_intelligence(user):
    pipeline = (
        Client.objects.filter(user=user)
        .values("status")
        .annotate(total=Count("id"))
    )
    return pipeline

def get_revenue_intelligence(user):
    from invoices.models import Invoice

    clients = Client.objects.filter(user=user)
    
    # Dynamically calculate actual collected revenue per client from invoices
    paid_invoices = Invoice.objects.filter(
        user=user, 
        client__isnull=False, 
        status__in=['paid', 'partly_paid']
    )
    
    client_invoiced_paid = {}
    for inv in paid_invoices:
        amt = inv.amount_paid if (inv.amount_paid and inv.amount_paid > Decimal('0.00')) else (inv.total_amount if inv.status == 'paid' else Decimal('0.00'))
        client_invoiced_paid[inv.client_id] = client_invoiced_paid.get(inv.client_id, Decimal('0.00')) + amt

    total_revenue = Decimal('0.00')
    client_revenues = []
    
    for c in clients:
        inv_rev = client_invoiced_paid.get(c.id, Decimal('0.00'))
        effective_ltv = max(inv_rev, c.lifetime_value or Decimal('0.00'))
        total_revenue += effective_ltv
        client_revenues.append({
            "id": c.id,
            "name": c.name,
            "company_name": c.company_name or "",
            "lifetime_value": float(effective_ltv)
        })

    client_revenues.sort(key=lambda x: x["lifetime_value"], reverse=True)
    top_clients = client_revenues[:5]

    return {
        "total_revenue": float(total_revenue),
        "top_clients": top_clients
    }

def get_dashboard_intelligence(user):
    now = timezone.now()
    clients = Client.objects.filter(user=user)
    total_clients = clients.count()
    active_clients = clients.filter(status="active").count()
    dormant_clients = clients.filter(status="dormant").count()
    
    attention_items = []
    # Evaluate all clients dynamically to ensure accuracy regardless of Celery schedule
    for c in clients:
        requires_attention, reasons = AttentionEngine.calculate_attention_required(c)
        if requires_attention:
            attention_items.append({
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "reasons": reasons
            })

    return {
        "attention_items": attention_items,
        "revenue": get_revenue_intelligence(user),
        "pipeline": get_pipeline_intelligence(user),
        "stats": {
            "total_clients": total_clients,
            "active_clients": active_clients,
            "dormant_clients": dormant_clients,
        }
    }

def get_full_client_intelligence(client):
    score, health, reasons = HealthScoringEngine.calculate_health(client)
    requires_attention, attention_reasons = AttentionEngine.calculate_attention_required(client)
    
    activities = ClientActivity.objects.filter(client=client).order_by("-created_at")[:10]
    memory = [{"type": a.activity_type, "description": a.description, "created_at": a.created_at} for a in activities]
    
    days_in_status = 0
    if client.status_changed_at:
        days_in_status = (timezone.now() - client.status_changed_at).days
    else:
        days_in_status = (timezone.now() - client.updated_at).days

    return {
        "relationship_health": {
            "score": score,
            "status": health,
            "reasons": reasons
        },
        "attention": {
            "requires_attention": requires_attention,
            "reasons": attention_reasons
        },
        "relationship_memory": memory,
        "segments": get_client_segmentation(client),
        "days_since_contact": HealthScoringEngine.get_days_since_contact(client),
        "days_in_status": days_in_status,
    }
