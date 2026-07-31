from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

class ProfitabilityCalculator:

    @staticmethod
    def calculate_total_cost(expenses,labor_cost):

        return expenses + labor_cost

    @staticmethod
    def calculate_profit(revenue,total_cost):

        return revenue - total_cost

    @staticmethod
    def calculate_profit_margin(profit,revenue):

        if revenue <= 0:
            return Decimal('0.00')

        margin = (profit / revenue) * 100

        return round(margin, 2)


class ProductivityCalculator:

    @staticmethod
    def calculate_completion_percentage(completed_tasks,total_tasks):

        if total_tasks <= 0:
            return Decimal('0.00')

        percentage = (
            Decimal(completed_tasks)
            / Decimal(total_tasks)
        ) * 100

        return round(percentage, 2)

    @staticmethod
    def calculate_effective_hourly_rate(revenue,total_minutes):

        if total_minutes <= 0:
            return Decimal('0.00')

        hours = Decimal(total_minutes) / Decimal('60')

        rate = revenue / hours

        return round(rate, 2)

    @staticmethod
    def calculate_team_utilization(billable_minutes,available_minutes):

        if available_minutes <= 0:
            return Decimal('0.00')

        utilization = (
            Decimal(billable_minutes)
            / Decimal(available_minutes)
        ) * 100

        return round(utilization, 2)


class DeliveryCalculator:

    @staticmethod
    def calculate_overdue_percentage(overdue_tasks,total_tasks):

        if total_tasks <= 0:
            return Decimal('0.00')

        percentage = (
            Decimal(overdue_tasks)
            / Decimal(total_tasks)
        ) * 100

        return round(percentage, 2)

    @staticmethod
    def calculate_project_velocity(completed_tasks,duration_days):

        if duration_days <= 0:
            return Decimal('0.00')

        velocity = (
            Decimal(completed_tasks)
            / Decimal(duration_days)
        )

        return round(velocity, 2)


class BudgetCalculator:

    @staticmethod
    def calculate_budget_remaining(budget,total_cost):

        return budget - total_cost

    @staticmethod
    def calculate_budget_usage_percentage(budget,total_cost):

        if budget <= 0:
            return Decimal('0.00')

        percentage = (
            Decimal(total_cost)
            / Decimal(budget)
        ) * 100

        return round(percentage, 2)

    @staticmethod
    def is_over_budget(budget,total_cost):

        return total_cost > budget


class HealthScoreCalculator:

    @staticmethod
    def calculate_health_score(completion_percentage, overdue_percentage, profit_margin, total_tasks=0, revenue=0):

        score = Decimal('100')

        score -= overdue_percentage * Decimal('0.5')

        # Do not penalize profit margin if there is no revenue yet
        if revenue > 0 and profit_margin < 20:
            score -= Decimal('20')

        # Do not penalize completion if there are no tasks yet
        if total_tasks > 0 and completion_percentage < 50:
            score -= Decimal('15')

        if score < 0:
            score = Decimal('0')

        return round(score, 2)

    @staticmethod
    def get_health_label(score):

        if score >= 80:
            return 'excellent'

        if score >= 60:
            return 'good'

        if score >= 40:
            return 'warning'

        return 'critical'



class ForecastCalculator:

    @staticmethod
    def estimate_completion_days(remaining_tasks,velocity):

        if velocity <= 0:
            return None

        estimated_days = (
            Decimal(remaining_tasks)
            / Decimal(velocity)
        )

        return round(estimated_days, 2)

    @staticmethod
    def estimate_final_profit(current_profit,projected_remaining_cost):

        return current_profit - projected_remaining_cost

    @staticmethod
    def estimate_completion_date(remaining_tasks,velocity):

        if velocity <= 0:
            return None

        estimated_days = (
            Decimal(remaining_tasks)
            / Decimal(velocity)
        )

        return (
            timezone.now()
            + timedelta(days=float(estimated_days))
        )


class StalledProjectCalculator:

    @staticmethod
    def is_project_stalled(last_activity,threshold_days=7):

        if not last_activity:
            return True

        inactive_days = (
            timezone.now() - last_activity
        ).days

        return inactive_days >= threshold_days


class RiskCalculator:

    @staticmethod
    def calculate_delivery_risk(overdue_tasks,stalled,velocity):

        risk_score = 0

        if overdue_tasks >= 3:
            risk_score += 30

        if stalled:
            risk_score += 40

        if velocity < 1:
            risk_score += 20

        if risk_score >= 60:
            return 'high'

        if risk_score >= 30:
            return 'medium'

        return 'low'
    

class VelocityCalculator:

    @staticmethod
    def calculate_velocity(completed_recently,days=14):

        if days <= 0:
            return Decimal('0.00')

        velocity = (
            Decimal(completed_recently)
            / Decimal(days)
        )

        return round(velocity, 2)