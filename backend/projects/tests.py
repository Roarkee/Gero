from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project, TaskList, Task, SubTask

User = get_user_model()

class SubTaskCompletionTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@test.com', password='password')
        self.project = Project.objects.create(user=self.user, name='Test Project')
        self.task_list = TaskList.objects.create(project=self.project, name='Todo')
        self.task = Task.objects.create(title='Main Task', task_list=self.task_list)

    def test_task_completes_when_all_subtasks_complete(self):
        sub1 = SubTask.objects.create(task=self.task, todo='Sub 1', completed=False)
        sub2 = SubTask.objects.create(task=self.task, todo='Sub 2', completed=False)

        self.assertFalse(self.task.completed)

        sub1.completed = True
        sub1.save()
        self.task.refresh_from_db()
        self.assertFalse(self.task.completed)

        sub2.completed = True
        sub2.save()
        self.task.refresh_from_db()
        self.assertTrue(self.task.completed)

    def test_task_completes_subtasks(self):
        sub1 = SubTask.objects.create(task=self.task, todo='Sub 1', completed=False)
        self.task.completed = True
        self.task.save()

        sub1.refresh_from_db()
        self.assertTrue(sub1.completed)
