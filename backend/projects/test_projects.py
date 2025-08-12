import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from users.models import User
from client.models import Client
from projects.models import Project, TaskList, Task

@pytest.fixture
def user(db):
    return User.objects.create_user(email="boss@gmail.com", password="50billion")

@pytest.fixture
def client_user(user):
    return Client.objects.create(name="Cool Client", user=user)

@pytest.fixture
def project(client_user):
    return Project.objects.create(name="Project 1", client=client_user)

@pytest.fixture
def task_list(project):
    return TaskList.objects.create(name="List 1", project=project)

@pytest.fixture
def task(task_list):
    return Task.objects.create(title="Task 1", task_list=task_list)

@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_list_projects(api_client, project):
    url = reverse("project-list")
    response = api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1

def test_create_project(api_client, client_user):
    url = reverse("project-list")
    data = {
        "name": "New Project",
        "description": "With a client",
        "client": client_user.id
    }
    response = api_client.post(url, data)
    assert response.status_code == 201
    assert response.data["name"] == "New Project"

def test_project_detail_with_nested(api_client, project):
    url = reverse("project-detail", args=[project.id])
    response = api_client.get(url)
    assert response.status_code == 200
    assert "task_lists" in response.data

def test_tasklist_with_tasks(api_client, task_list):
    url = reverse("tasklist-with-tasks", args=[task_list.id])
    response = api_client.get(url)
    assert response.status_code == 200
    assert "tasks" in response.data

def test_task_with_subtasks(api_client, task):
    url = reverse("task-with-subtasks", args=[task.id])
    response = api_client.get(url)
    assert response.status_code == 200
    assert "subtasks" in response.data
