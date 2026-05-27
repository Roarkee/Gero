
from decimal import Decimal
from random import randint, choice, uniform
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from faker import Faker

from client.models import Client
from projects.models import (
    Project,
    Task,
    SubTask,
    TaskList,
    TimeEntry
)
from invoices.models import Invoice, InvoiceItem
from expenses.models import Expense


fake = Faker()
User = get_user_model()


class Command(BaseCommand):
    help = "Seeds realistic freelancer SaaS data"

    def handle(self, *args, **kwargs):

    #     self.stdout.write(self.style.WARNING("Deleting old data..."))

    #     InvoiceItem.objects.all().delete()
    #     Invoice.objects.all().delete()
    #     TimeEntry.objects.all().delete()
    #     Task.objects.all().delete()
    #     Project.objects.all().delete()
    #     Client.objects.all().delete()
    #     Expense.objects.all().delete()
    #     User.objects.exclude(is_superuser=True).delete()

    #     self.stdout.write(self.style.SUCCESS("Old data deleted"))

    #     users = []

    #     self.stdout.write(self.style.WARNING("Creating users..."))

    #     for i in range(10):

    #         user = User.objects.create_user(
    #             email=f"user{i}@example.com",
    #             password="henorkam",
    #             first_name=fake.first_name(),
    #             last_name=fake.last_name()
    #         )

    #         users.append(user)

    #     self.stdout.write(self.style.SUCCESS("20 users created"))

    #     all_clients = []

    #     self.stdout.write(self.style.WARNING("Creating clients..."))

    #     client_statuses = [
    #         ('lead'),
    #         ('inquiry'),
    #         ('proposal_sent'),
    #         ('negotiating'),
    #         ('onboarding'),
    #         ('active'),
    #         ('waiting_on_client'),
    #         ('revision'),
    #         ('completed'),
    #         ('paused'),
    #         ('dormant'),
    #         ('churned'),
    #     ]
    #     client_sources = [
    #         ('referral'),
    #         ('linkedin'),
    #         ('twitter'),
    #         ('website',),
    #         ('cold_outreach'),
    #         ('tiktok'), 
    #     ]
    #     for _ in range(30):

    #         user = choice(users)

    #         client = Client.objects.create(
    #             user=user,
    #             name=fake.company(),
    #             email=fake.company_email(),
    #             phone_number=f"+233{randint(200000000, 999999999)}"[:15],
    #             status=choice(client_statuses),
    #             lifetime_value=Decimal(str(randint(500, 50000))),
    #             created_at=timezone.now() - timedelta(days=randint(1, 500)),
    #             default_hourly_rate = Decimal(randint(20,400)),
    #             min_budget = Decimal(randint(0,1500)),
    #             max_budget = Decimal(randint(100, 25000)),
    #             source = choice(client_sources)
    #         )

    #         all_clients.append(client)

    #     self.stdout.write(self.style.SUCCESS("30 clients created"))

    #     self.stdout.write(self.style.WARNING("Creating projects..."))

    #     project_statuses = [
    #     ('active'),
    #     ('inactive'),
    #     ('completed'),
    #     ('cancelled'),
    # ]

    #     task_status_lists = [
    #         'todo',
    #         'in_progress',
    #         'done'
    #     ]

    #     all_projects = []
    #     priority =[
    #         ('low'),
    #         ('medium'),
    #         ('high'),
    #         ('urgent'),
    #     ]

    #     for client in all_clients:

    #         total_projects = randint(2,4)

    #         for _ in range(total_projects):

    #             project = Project.objects.create(
    #                 user=client.user,
    #                 client=client,
    #                 name=fake.catch_phrase(),
    #                 description=fake.paragraph(nb_sentences=5),
    #                 status=choice(project_statuses),
    #                 budget=Decimal(str(randint(1000, 25000))),
    #                 created_at=timezone.now() - timedelta(days=randint(1, 300)),
    #                 priority = choice(priority)
    #             )

    #             all_projects.append(project)

    #             task_lists = {}

    #             for list_type in task_status_lists:

    #                 task_list = TaskList.objects.create(
    #                     project=project,
    #                     name=list_type.replace('_', ' ').title(),
    #                     list_type=list_type,
    #                     position = randint(0,3)
    #                 )

    #                 task_lists[list_type] = task_list

    #             for _ in range(randint(3,8)):

    #                 selected_list = choice(task_status_lists)

    #                 task = Task.objects.create(
    #                     task_list=task_lists[selected_list],
    #                     title=fake.text(max_nb_chars=40),
    #                     description=fake.paragraph(nb_sentences=2),
    #                     due_date=timezone.now() + timedelta(days=randint(-30, 60)),
    #                     completed=selected_list == 'done',
    #                     priority=choice(['low', 'medium', 'high', 'urgent']),
    #                     estimated_hours=Decimal(str(randint(1, 40)))
    #                 )

    #                 for _ in range(randint(0, 5)):
    #                     i=0
    #                     SubTask.objects.create(
    #                         task=task,
    #                         todo=fake.sentence(nb_words=4),
    #                         completed=choice([True, False]),
    #                         position = i
    #                     )
    #                     i+=1

    #                 for _ in range(randint(1, 8)):
    #                     duration = randint(15, 240)
    #                     start = timezone.now() - timedelta(days=randint(1, 100))
    #                     end = start + timedelta(minutes=duration)

                        
    #                     hourly_rate = Decimal(str(randint(10, 120)))

    #                     TimeEntry.objects.create(
    #                         user=client.user,
    #                         project=project,
    #                         task=task,
    #                         description=fake.sentence(),
    #                         duration_minutes=duration,
    #                         hourly_rate=hourly_rate,
    #                         start_time=start,
    #                         end_time=end,
    #                     )
                        

        self.stdout.write(self.style.WARNING("Creating invoices..."))

        InvoiceItem.objects.all().delete()
        Invoice.objects.all().delete()

        invoice_statuses = [
            Invoice.InvoiceStatus.DRAFT,
            Invoice.InvoiceStatus.SENT,
            Invoice.InvoiceStatus.PAID,
            Invoice.InvoiceStatus.OVERDUE,
            Invoice.InvoiceStatus.CANCELLED
        ]

        projects = list(Project.objects.all())
        users = list(User.objects.all())

        for _ in range(400):

            project = choice(projects)
            client = project.client

            issue_date = timezone.now().date() - timedelta(days=randint(1, 180))
            due_date = issue_date + timedelta(days=randint(7, 30))

            final_status = choice(invoice_statuses)

            # ALWAYS create as draft first
            invoice = Invoice.objects.create(
                user=client.user,
                client=client,
                project=project,
                title=fake.sentence(nb_words=4),
                description=fake.paragraph(nb_sentences=3),
                tax_rate=Decimal('15.00'),
                issue_date=issue_date,
                due_date=due_date,
                status=Invoice.InvoiceStatus.DRAFT,
            )

            total_items = randint(3, 7)

            for _ in range(total_items):

                quantity = Decimal(str(randint(1, 10)))
                rate = Decimal(str(randint(50, 2000)))

                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=fake.sentence(nb_words=6),
                    quantity=quantity,
                    rate=rate
                )

            # calculate totals AFTER items exist
            invoice.recalculate_totals()

            # now apply final status
            invoice.status = final_status

            if final_status == Invoice.InvoiceStatus.PAID:
                invoice.paid_date = timezone.now().date()

            invoice.save()

        self.stdout.write(self.style.SUCCESS("400 invoices created"))