from .selectors import InvoiceSelector
from .calculators import (
    CashFlowCalculator,
    ClientRiskCalculator,
    CollectionEfficiencyCalculator,
    RevenueConcentrationCalculator,
    AgingReceivablesCalculator,
    CollectionPerformanceCalculator

)

class InvoiceIntelligenceService:

    def __init__(self, user):
        self.user = user
        self.selector = InvoiceSelector(user=user)

    def get_dashboard(self):
        overdue = self.selector.get_overdue_invoices()
        paid = self.selector.get_paid_invoices()
        revenue = self.selector.get_monthly_revenue()
        avg_invoice_size = (
            self.selector.get_avg_invoice_size()
        )
        receivables = (
            CashFlowCalculator
            .calculate_receivables(
                self.selector.queryset
            )
        )

        return {
            'overdue': overdue,
            'paid': paid,
            'monthly_revenue': list(revenue),
            'avg_invoice_size': avg_invoice_size,
            'receivables': receivables
        }

    def get_invoice_risk_report(self):
        invoices = self.selector.queryset.select_related(
            'client',
            'project'
        )
        results = []
        for invoice in invoices:
            # risk = (
            #     InvoiceRiskCalculator
            #     .calculate_overdue_risk(invoice)
            # )
            results.append({
                'invoice_id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'client': invoice.client.name,
                # 'risk': risk
            })

        return results
    
class ClientIntelligenceService:

    def __init__(self, user):
        self.selector = InvoiceSelector(user)

    def payment_behavior(self):

        return list(
            self.selector.get_client_payment_behavior()
        )

    def risk_report(self):

        clients = (
            self.selector.get_client_payment_behavior()
        )

        return [
            ClientRiskCalculator.calculate(client)
            for client in clients
        ]
    
class RevenueIntelligenceService:

    def __init__(self, user):
        self.selector = InvoiceSelector(user)

    def monthly_revenue(self):

        return list(
            self.selector.get_monthly_revenue()
        )

    def top_clients(self):

        return list(
            self.selector.get_top_clients_by_revenue()
        )

    def concentration_risk(self):

        clients = list(
            self.selector.get_top_clients_by_revenue()
        )

        return (
            RevenueConcentrationCalculator
            .calculate(clients)
        )


class CashFlowIntelligenceService:

    def __init__(self, user):
        self.selector = InvoiceSelector(user)

    def receivables(self):

        return (
            CashFlowCalculator
            .calculate_receivables(
                self.selector.queryset
            )
        )

    def aging_receivables(self):

        invoices = (
            self.selector
            .get_overdue_invoice_aging()
        )

        return (
            AgingReceivablesCalculator
            .calculate(invoices)
        )


class CollectionIntelligenceService:

    def __init__(self, user):
        self.selector = InvoiceSelector(user)

    def performance(self):

        avg_cycle = (
            self.selector
            .get_average_collection_cycle()
            .get("average_cycle")
            or 0
        )

        overdue_pct = (
            self.selector
            .get_overdue_percentage()
        )

        return (
            CollectionPerformanceCalculator
            .calculate(
                avg_cycle,
                overdue_pct
            )
        )

    def collection_rate(self):

        total = (
            self.selector
            .queryset
            .count()
        )

        paid = (
            self.selector
            .queryset
            .filter(status='paid')
            .count()
        )

        return {
            "collection_rate":
            CollectionEfficiencyCalculator
            .calculate_collection_rate(
                total,
                paid
            )
        }
    
class RiskIntelligenceService:

    def __init__(self, user):
        self.selector = InvoiceSelector(user)

    def invoice_risks(self):

        invoices = (
            self.selector.queryset
            .select_related('client')
        )

        report = []

        for invoice in invoices:

            report.append({
                "invoice_id": invoice.id,
                "invoice_number":
                    invoice.invoice_number,

                # "risk":
                #     InvoiceRiskCalculator
                #     .calculate_overdue_risk(
                #         invoice
                #     )
            })

        return report


