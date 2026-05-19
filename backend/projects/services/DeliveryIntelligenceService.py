from projects.models import Project, Task, TimeEntry, RecurringTask, ProjectActivity
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q,F,Sum, Count



'''
how can i make the project app intelligent?
should i add a calendar? to help with time management and scheduling?

project progress
project health(i'll do this down the line)


-tasks completed
-tasks in progress
-tasks overdue
-tasks pending

total logged hours
completion percentage
budget remaining
budget used
what more?

'''
class ProjectService:
    def get_project_progress(self, project):
        '''i think with this, i'd have to add a field on the task model to check for completion
        of subtasks on projects or if a project is in the last tasklist then it would be marked as 
        completed'''
        pass

    def get_total_logged_hours(self, project):
        '''i think this would come from timeentry on the task model'''
        pass

    # intelligence on how fast the freelancer works
    # it should answer questions like is he behind?, when will the project be completed?
    # what tasks are blocking progress?, is workload realistic?are we moving fast enough

class DeliveryIntelligenceService:
    def __init__(self, project):
        self.project = project

    def calculate(self):
        tasks = Task.objects.filter(task_list__project = self.project).prefetch_related('time_entries', 'subtasks')
    
        total_tasks = tasks.count()
        if self.project.task_list.list_type == "done":
            completed_tasks = Count(tasks.filter(task_list__list_type = "done"))
        elif self.project.task_list.list_type == "custom":
            completed_tasks = Count(tasks.filter(Q(completed = True)|Q(subtasks__completed = True)))

        tasks_in_progress = total_tasks - completed_tasks if total_tasks > completed_tasks else 0

        tasks_overdue = Count(tasks.filter(Q(completed = False)|Q(subtasks_completed = False)&Q(duedate__lt = timezone.now())))
        active_tasks = tasks.filter(
            task_list__list_type='in_progress'
        ).count()

        completion_percentage = 0

        if total_tasks > 0:
            completion_percentage = int(
                (completed_tasks / total_tasks) * 100
            )

        velocity = self.calculate_velocity()

        estimated_completion = self.predict_completion_date(
            total_tasks,
            completed_tasks,
            velocity
        )

        stalled = self.detect_stalled_project()

        risk_level = self.calculate_risk(
            overdue_tasks,
            stalled,
            velocity
        )

        insight, _ = ProjectInsight.objects.get_or_create(
            project=self.project
        )

        insight.total_tasks = total_tasks
        insight.tasks_completed = completed_tasks
        insight.active_tasks = active_tasks
        insight.overdue_tasks = overdue_tasks
        insight.completion_percentage = completion_percentage
        insight.completion_velocity = velocity
        insight.estimated_completion_date = estimated_completion
        insight.last_activity_at = self.get_last_activity()
        insight.stalled = stalled
        insight.risk_level = risk_level

        insight.save()

        return insight


    def calculate_velocity(self):
        last_14_days = timezone.now() - timedelta(days=14)

        completed_recently = Task.objects.filter(
            task_list__project=self.project,
            task_list__list_type='done',
            updated_at__gte=last_14_days
        ).count()

        return round(completed_recently / 14, 2)    


    def predict_completion_date(
    self,
    total_tasks,
    completed_tasks,
    velocity
):


        remaining_tasks = total_tasks - completed_tasks

        if velocity <= 0:
            return None

        estimated_days = remaining_tasks / velocity

        return timezone.now() + timedelta(days=estimated_days)

    def detect_stalled_project(self):

        last_activity = self.get_last_activity()

        if not last_activity:
            return True

        days_inactive = (
            timezone.now() - last_activity
        ).days

        return days_inactive >= 7


    def get_last_activity(self):

        activity = self.project.activities.first()

        if activity:
            return activity.created_at

        return None


    def calculate_risk(
    self,
    overdue_tasks,
    stalled,
    velocity
):

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


class TaskService:    
    def get_tasks_overdue(self, task):
        pass

    def get_tasks_pending(self, task):
        pass
    def get_tasks_in_progress(self, task):
        pass
    def get_tasks_completed(self, task):
        pass
    
 