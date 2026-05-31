from django.urls import path

from intelligence.views.invoice import (
    InvoiceDashboardView,
    ClientPaymentBehaviourView,
    ClientRiskReportView,
    MonthlyRevenueView,
    TopClientsRevenueView,
    RevenueConcentrationView,
    ReceivablesView,
    CollectionPerformanceView,
    CollectionRateView,
    InvoiceRiskView,
)

urlpatterns = [
    path(
        'dashboard/',
        InvoiceDashboardView.as_view()
    ),

    path(
        'clients/payment-behaviour/',
        ClientPaymentBehaviourView.as_view()
    ),

    path(
        'clients/risk/',
        ClientRiskReportView.as_view()
    ),

    path(
        'revenue/monthly/',
        MonthlyRevenueView.as_view()
    ),

    path(
        'revenue/top-clients/',
        TopClientsRevenueView.as_view()
    ),

    path(
        'revenue/concentration/',
        RevenueConcentrationView.as_view()
    ),

    path(
        'cashflow/receivables/',
        ReceivablesView.as_view()
    ),

    path(
        'collection/performance/',
        CollectionPerformanceView.as_view()
    ),

    path(
        'collection/rate/',
        CollectionRateView.as_view()
    ),

    path(
        'risk/invoices/',
        InvoiceRiskView.as_view()
    ),
]