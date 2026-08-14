from decimal import Decimal

from .selectors import ProjectSelectors
from .calculators import (
    ProfitabilityCalculator,
    ProductivityCalculator,
    DeliveryCalculator,
    BudgetCalculator,
    HealthScoreCalculator,
    StalledProjectCalculator,
    VelocityCalculator,
    ForecastCalculator,
    RiskCalculator
)

from projects.models import Project


class ProjectProfitabilityService:

    @staticmethod
    def get_project_profitability(project_id):

        revenue = ProjectSelectors.get_paid_revenue(project_id)

        expenses = ProjectSelectors.get_total_expenses(project_id)

        labor_cost = ProjectSelectors.get_total_labor_cost(project_id)

        total_cost = (
            ProfitabilityCalculator.calculate_total_cost(
                expenses=expenses,
                labor_cost=labor_cost
            )
        )

        profit = (
            ProfitabilityCalculator.calculate_profit(
                revenue=revenue,
                total_cost=total_cost
            )
        )

        margin = (
            ProfitabilityCalculator.calculate_profit_margin(
                profit=profit,
                revenue=revenue
            )
        )

        return {
            "revenue": revenue,
            "expenses": expenses,
            "labor_cost": labor_cost,
            "total_cost": total_cost,
            "profit": profit,
            "profit_margin": margin,
        }


class ProjectProductivityService:

    @staticmethod
    def get_project_productivity(project_id):

        total_tasks = (
            ProjectSelectors.get_total_tasks(project_id)
        )

        completed_tasks = (
            ProjectSelectors.get_completed_tasks(project_id)
        )

        total_minutes = (
            ProjectSelectors.get_total_logged_minutes(project_id)
        )

        revenue = (
            ProjectSelectors.get_paid_revenue(project_id)
        )

        project = Project.objects.get(id=project_id)
        if project.completed:
            completion_percentage = Decimal('100.00')
        else:
            completion_percentage = (
                ProductivityCalculator.calculate_completion_percentage(
                    completed_tasks=completed_tasks,
                    total_tasks=total_tasks
                )
            )

        effective_hourly_rate = (
            ProductivityCalculator.calculate_effective_hourly_rate(
                revenue=revenue,
                total_minutes=total_minutes
            )
        )

        return {
            "tasks_completed": completed_tasks,
            "total_tasks": total_tasks,
            "completion_percentage": completion_percentage,
            "time_logged_minutes": total_minutes,
            "effective_hourly_rate": effective_hourly_rate,
        }


class ProjectDeliveryService:

    @staticmethod
    def get_delivery_metrics(project_id):

        total_tasks = (
            ProjectSelectors.get_total_tasks(
                project_id
            )
        )

        completed_tasks = (
            ProjectSelectors.get_completed_tasks(
                project_id
            )
        )

        overdue_tasks = (
            ProjectSelectors.get_overdue_tasks(
                project_id
            )
        )

        overdue_percentage = (
            DeliveryCalculator.calculate_overdue_percentage(
                overdue_tasks=overdue_tasks,
                total_tasks=total_tasks
            )
        )

        recent_completed_tasks = (
            ProjectSelectors.get_recent_completed_tasks(
                project_id=project_id,
                days=14
            )
        )

        velocity = (
            VelocityCalculator.calculate_velocity(
                completed_recently=recent_completed_tasks,
                days=14
            )
        )

        remaining_tasks = (
            total_tasks - completed_tasks
        )

        estimated_completion_date = (
            ForecastCalculator.estimate_completion_date(
                remaining_tasks=remaining_tasks,
                velocity=velocity
            )
        )

        last_activity = (
            ProjectSelectors.get_last_activity(
                project_id
            )
        )

        stalled = (
            StalledProjectCalculator.is_project_stalled(
                last_activity=last_activity,
                threshold_days=7
            )
        )

        risk_level = (
            RiskCalculator.calculate_delivery_risk(
                overdue_tasks=overdue_tasks,
                stalled=stalled,
                velocity=velocity
            )
        )

        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "remaining_tasks": remaining_tasks,
            "overdue_tasks": overdue_tasks,
            "overdue_percentage": overdue_percentage,
            "velocity": velocity,
            "estimated_completion_date": (
                estimated_completion_date
            ),
            "last_activity": last_activity,
            "stalled": stalled,
            "risk_level": risk_level,
        }

class ProjectBudgetService:

    @staticmethod
    def get_budget_status(project_id):

        project = Project.objects.get(id=project_id)

        budget = (
            project.budget
            or Decimal('0.00')
        )

        expenses = (
            ProjectSelectors.get_total_expenses(project_id)
        )

        labor_cost = (
            ProjectSelectors.get_total_labor_cost(project_id)
        )

        total_cost = (
            ProfitabilityCalculator.calculate_total_cost(
                expenses=expenses,
                labor_cost=labor_cost
            )
        )

        remaining_budget = (
            BudgetCalculator.calculate_budget_remaining(
                budget=budget,
                total_cost=total_cost
            )
        )

        usage_percentage = (
            BudgetCalculator.calculate_budget_usage_percentage(
                budget=budget,
                total_cost=total_cost
            )
        )

        over_budget = (
            BudgetCalculator.is_over_budget(
                budget=budget,
                total_cost=total_cost
            )
        )

        return {
            "budget": budget,
            "total_cost": total_cost,
            "remaining_budget": remaining_budget,
            "budget_usage_percentage": usage_percentage,
            "is_over_budget": over_budget,
        }


class ProjectHealthService:

    @staticmethod
    def get_project_health(project_id):

        profitability = (
            ProjectProfitabilityService.get_project_profitability(
                project_id
            )
        )

        productivity = (
            ProjectProductivityService.get_project_productivity(
                project_id
            )
        )

        delivery = (
            ProjectDeliveryService.get_delivery_metrics(
                project_id
            )
        )

        health_score = (
            HealthScoreCalculator.calculate_health_score(
                completion_percentage=(
                    productivity['completion_percentage']
                ),
                overdue_percentage=(
                    delivery['overdue_percentage']
                ),
                profit_margin=(
                    profitability['profit_margin']
                ),
                total_tasks=(
                    productivity['total_tasks']
                ),
                revenue=(
                    profitability['revenue']
                )
            )
        )

        label = (
            HealthScoreCalculator.get_health_label(
                health_score
            )
        )

        return {
            "health_score": health_score,
            "health_label": label,
            "profitability": profitability,
            "productivity": productivity,
            "delivery": delivery,
        }


class ProjectOverviewService:

    @staticmethod
    def get_project_overview(project_id):

        profitability = (
            ProjectProfitabilityService.get_project_profitability(
                project_id
            )
        )

        productivity = (
            ProjectProductivityService.get_project_productivity(
                project_id
            )
        )

        delivery = (
            ProjectDeliveryService.get_delivery_metrics(
                project_id
            )
        )

        budget = (
            ProjectBudgetService.get_budget_status(
                project_id
            )
        )

        health = (
            ProjectHealthService.get_project_health(
                project_id
            )
        )

        return {
            "profitability": profitability,
            "productivity": productivity,
            "delivery": delivery,
            "budget": budget,
            "health": health,
        }