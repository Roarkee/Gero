from celery import Celery
import os


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

#app instance of celery
app = Celery('config')


#this is to add djanog's configuration settings module as a source of
#celery's configuration. the name space is to make sure
#that all celery related configuration keys have a common prefix CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

#this is to find all files named tasks in the installed apps
app.autodiscover_tasks()