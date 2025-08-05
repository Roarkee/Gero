from rest_framework import serializers

class OwnerValidationMixin:
    def validate_ownership(self, related_instance, user, message="You do not have permission to use this resource."):
        """
        Checks if the related instance is owned by the current user.
        Traces ownership through .client.owner or .project.client.owner, etc.
        """
        owner = self._get_owner_from_instance(related_instance)
        if owner != user:
            raise serializers.ValidationError(message)

    def _get_owner_from_instance(self, instance):
        """
        Tries to walk through common ownership paths.
        """
        
        if hasattr(instance, 'user'):
            return instance.user
        # Project → Client → Owner
       
        if hasattr(instance, 'client') and hasattr(instance.client, 'user'):
            return instance.client.owner
        # Task → TaskList → Project → Client → Owner
        if hasattr(instance, 'task_list'):
            return self._get_owner_from_instance(instance.task_list)
        # SubTask → Task → TaskList → ...
        if hasattr(instance, 'task'):
            return self._get_owner_from_instance(instance.task)
        # Label → Project → Client → Owner
        if hasattr(instance, 'project'):
            return self._get_owner_from_instance(instance.project)
        raise AttributeError("Could not determine owner from instance.")
