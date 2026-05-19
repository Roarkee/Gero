from rest_framework import permissions

class IsClientOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a client to access/edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        # Wait, in multi-tenant we only want the owner to see it.
        # So we do NOT allow safe methods to non-owners.
        return obj.user == request.user

class IsActivityOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an activity (via client) to access it.
    """

    def has_object_permission(self, request, view, obj):
        return obj.client.user == request.user
