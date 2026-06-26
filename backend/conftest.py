"""
conftest.py — project-level pytest configuration
Ensures the 'ai' app is registered and test DB is in-memory.
"""
import django
from django.conf import settings


def pytest_configure(config):
    """Inject 'ai' app into INSTALLED_APPS before Django sets up."""
    from django.apps import apps
    if not apps.ready:
        # Patch ai into INSTALLED_APPS if it's missing
        current = list(getattr(settings, "INSTALLED_APPS", []))
        if "ai" not in current:
            current.append("ai")
            settings.INSTALLED_APPS = current
