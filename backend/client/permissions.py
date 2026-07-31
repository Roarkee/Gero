from rest_framework import permissions

class IsClientOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a client to access/edit it.
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsActivityOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an activity (via client) to access it.
    """

    def has_object_permission(self, request, view, obj):
        return obj.client.user == request.user


class IsClientUser(permissions.BasePermission):
    """
    Allows access to authenticated users for the Client Portal endpoints.
    Data scoping is enforced in views via _client(user).
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsFreelancerUser(permissions.BasePermission):
    """
    Allows access to users with role='freelancer' (default).
    Blocks pure client-role users without freelancer activity from accessing the main dashboard API.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return getattr(request.user, 'role', None) == 'freelancer' or request.user.is_staff
