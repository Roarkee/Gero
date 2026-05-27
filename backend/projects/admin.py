from django.contrib import admin
from .models import Task, Project, ProjectActivity

# Register your models here.

admin.site.register(Task)
admin.site.register(Project)
admin.site.register(ProjectActivity)