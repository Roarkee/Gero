from rest_framework import permissions

class IsClientUser(permissions.BasePermission):
    """
    Allows access only to users with the 'client' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'client')

class IsFreelancerUser(permissions.BasePermission):
    """
    Allows access only to users with the 'freelancer' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'freelancer')
