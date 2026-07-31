from django.test import TestCase
from decimal import Decimal
from intelligence.project.calculators import HealthScoreCalculator

class HealthScoreCalculatorTests(TestCase):
    def test_empty_project_health_score(self):
        # A project with 0 tasks and 0 revenue should start at 100% health
        score = HealthScoreCalculator.calculate_health_score(
            completion_percentage=Decimal('0'),
            overdue_percentage=Decimal('0'),
            profit_margin=Decimal('0'),
            total_tasks=0,
            revenue=0
        )
        self.assertEqual(score, Decimal('100.00'))

    def test_project_with_tasks_penalized(self):
        # A project with tasks but low completion should be penalized
        score = HealthScoreCalculator.calculate_health_score(
            completion_percentage=Decimal('10'),
            overdue_percentage=Decimal('0'),
            profit_margin=Decimal('0'),
            total_tasks=5,
            revenue=0
        )
        # Should subtract 15 for low completion percentage
        self.assertEqual(score, Decimal('85.00'))

    def test_project_with_revenue_penalized(self):
        # A project with revenue but low profit margin should be penalized
        score = HealthScoreCalculator.calculate_health_score(
            completion_percentage=Decimal('60'),
            overdue_percentage=Decimal('0'),
            profit_margin=Decimal('10'),
            total_tasks=5,
            revenue=1000
        )
        # Should subtract 20 for low profit margin
        self.assertEqual(score, Decimal('80.00'))
