from config.celery import app as celery_app

#this will make sure that celery is always imported when django is started
__all__ = ('celery_app',)