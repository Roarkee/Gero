import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from decimal import Decimal
import datetime
from users.models import User
from client.models import Client
from projects.models import Project
from invoices.models import Invoice, InvoiceItem

@pytest.fixture
def user(db):
    return User.objects.create_user(email="invoicer@example.com", password="password")

@pytest.fixture
def client_obj(user):
    return Client.objects.create(name="Cool Client", user=user)

@pytest.fixture
def project(client_obj, user):
    return Project.objects.create(name="Invoice Project", client=client_obj, user=user)

@pytest.fixture
def invoice(user, client_obj):
    return Invoice.objects.create(
        user=user,
        client=client_obj,
        title="Test Invoice",
        tax_rate=Decimal("10.00"),
        issue_date=datetime.date(2026, 7, 1),
        due_date=datetime.date(2026, 7, 15)
    )

@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def test_invoice_totals_recalculated_on_item_save(invoice):
    assert invoice.subtotal == Decimal("0.00")
    assert invoice.total_amount == Decimal("0.00")

    # Add an item
    item = InvoiceItem.objects.create(
        invoice=invoice,
        description="Web Dev",
        quantity=Decimal("10.00"),
        rate=Decimal("50.00")
    )
    
    invoice.refresh_from_db()
    assert invoice.subtotal == Decimal("500.00")
    assert invoice.tax_amount == Decimal("50.00")
    assert invoice.total_amount == Decimal("550.00")

    # Edit the item
    item.quantity = Decimal("5.00")
    item.save()

    invoice.refresh_from_db()
    assert invoice.subtotal == Decimal("250.00")
    assert invoice.tax_amount == Decimal("25.00")
    assert invoice.total_amount == Decimal("275.00")

    # Delete the item
    item.delete()
    
    invoice.refresh_from_db()
    assert invoice.subtotal == Decimal("0.00")
    assert invoice.tax_amount == Decimal("0.00")
    assert invoice.total_amount == Decimal("0.00")

def test_invoice_item_api_updates_totals(api_client, invoice):
    url = reverse("invoiceitem-list")
    data = {
        "invoice": invoice.id,
        "description": "API Test Item",
        "quantity": "2.00",
        "rate": "100.00"
    }
    response = api_client.post(url, data)
    assert response.status_code == 201

    invoice.refresh_from_db()
    assert invoice.subtotal == Decimal("200.00")
    assert invoice.tax_amount == Decimal("20.00")
    assert invoice.total_amount == Decimal("220.00")


def test_cancel_and_duplicate_invoice(api_client, invoice):
    # Cancel action
    cancel_url = reverse("invoice-cancel-invoice", kwargs={"pk": invoice.id})
    res = api_client.post(cancel_url)
    assert res.status_code == 200
    invoice.refresh_from_db()
    assert invoice.status == "cancelled"

    # Duplicate action
    dup_url = reverse("invoice-duplicate-invoice", kwargs={"pk": invoice.id})
    res = api_client.post(dup_url)
    assert res.status_code == 200
    assert "id" in res.data
    
    # Verify duplicates exist
    new_id = res.data["id"]
    new_invoice = Invoice.objects.get(id=new_id)
    assert new_invoice.status == "draft"
    assert new_invoice.title == f"Copy of {invoice.title}"


def test_invoice_notification_signals(user, client_obj):
    from notifications.models import Notification
    
    # Create invoice
    inv = Invoice.objects.create(
        user=user,
        client=client_obj,
        title="Signal Test",
        tax_rate=Decimal("10.00"),
        issue_date=datetime.date(2026, 7, 1),
        due_date=datetime.date(2026, 7, 15)
    )

    # Change to Paid triggers notification
    inv.status = "paid"
    inv.save()

    notification = Notification.objects.filter(user=user, type="payment_received").first()
    assert notification is not None
    assert "Signal Test" in notification.title

