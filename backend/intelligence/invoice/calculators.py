from decimal import Decimal
from django.utils import timezone
from django.db.models import F, Sum
from .selectors import InvoiceSelector


class CashFlowCalculator:

    @staticmethod
    def calculate_receivables(invoices):
        outstanding = invoices.filter(
            status__in=['sent', 'overdue']
        )
        overdue = invoices.filter(
            status='overdue'
        )

        return {
            'outstanding_amount':
                outstanding.aggregate(
                    total=Sum('total_amount')
                )['total'] or 0,
 
            'overdue_amount':
                overdue.aggregate(
                    total=Sum('total_amount')
                )['total'] or 0,
        }


class CollectionEfficiencyCalculator:

    @staticmethod
    def calculate_collection_rate(total, paid):

        if total <= 0:
            return 0

        return round(
            (paid / total) * 100,
            2
        )


class CollectionPerformanceCalculator:

    @staticmethod
    def calculate(avg_collection_days, overdue_ratio):
        score = 100

        if avg_collection_days > 30:
            score -= 20

        if overdue_ratio > 20:
            score -= 30

        return {
            "score": max(score, 0),
            "rating": (
                "Excellent"
                if score >= 80
                else "Needs Attention"
            )
        }


class ClientRiskCalculator:

    @staticmethod
    def calculate(client):
        score = 0
        if client["average_payment_days"] > 30:
            score += 30

        if client["overdue_ratio"] > 25:
            score += 40

        if client["late_payments"] > 5:
            score += 30

        if score >= 70:
            risk = "High"
        elif score >= 40:
            risk = "Medium"
        else:
            risk = "Low"

        return {
            "client": client["client__name"],
            "risk": risk,
            "score": score
        }


class RevenueConcentrationCalculator:

    @staticmethod
    def calculate(clients):
        total = sum(c["total"] for c in clients)

        biggest = max(c["total"] for c in clients)

        concentration = (
            biggest / total * 100
            if total else 0
        )

        return {
            "concentration_percent": round(concentration, 2)
        }


class AgingReceivablesCalculator:

    @staticmethod
    def calculate(invoices):

        buckets = {
            "0_30": 0,
            "31_60": 0,
            "61_90": 0,
            "90_plus": 0,
        }

        for invoice in invoices:

            days = invoice["days_overdue"]
            amount = invoice["amount"]

            if days <= 30:
                buckets["0_30"] += amount

            elif days <= 60:
                buckets["31_60"] += amount

            elif days <= 90:
                buckets["61_90"] += amount

            else:
                buckets["90_plus"] += amount

        return buckets









