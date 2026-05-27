from projects.models import ProjectActivity, Task
class ActivityService:

    @staticmethod
    def log(
        project,
        activity_type,
        description,
        task:Task,
        user=None,
        metadata = None,
    ):

        return ProjectActivity.objects.create(
            project=project,
            user=user,
            metadata=metadata,
            activity_type=activity_type,
            description=description,
            task=task,
            
        )