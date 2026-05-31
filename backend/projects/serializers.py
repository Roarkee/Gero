from rest_framework import serializers
from projects.models import Project, Task, TaskList, Label, SubTask, TimeEntry, ProjectActivity, Attachment,RecurringTask
from django.utils import timezone
from projects.mixins import OwnerValidationMixin

datetime_formats = ['%Y-%m-%d %H:%M', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d']


class ProjectSerializer(serializers.ModelSerializer,OwnerValidationMixin):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_client(self, client):#this is a field level validator. it checks if the project belongs to the client
        #and if the client belongs to the authenticated user
        self.validate_ownership(client, self.context['request'].user, "You do not have permission to create a project for this client.")
        return client
    ''' the validate_ownership method is sort of a roundabout way of checking if the model instances belong to the authenticated user. i run checks
    maybe there'll be better inspiration next time.'''


class TaskSerializer(serializers.ModelSerializer):
    due_date = serializers.DateTimeField(input_formats=datetime_formats, required=False, allow_null=True)
    start_date = serializers.DateTimeField(input_formats=datetime_formats, required=False, allow_null=True)
    human_due = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'labels': {'required': False, 'allow_empty': True},
            'description': {'required': False},
        }

    def validate(self, data):#this checks if the dates are in the data passed before going to the conditionals
        start = data.get('start_date', self.instance.start_date if self.instance else None)
        #getattr is used to get the
        #value of startdate from the Task if it exists, otherwise it returns None
        due = data.get('due_date', self.instance.due_date if self.instance else None)

        if start and due:
            if start > due:
                raise serializers.ValidationError("Start date cannot be after due date.")
            if start < timezone.now():
                raise serializers.ValidationError("Start date cannot be in the past.")
            if due < timezone.now():
                raise serializers.ValidationError("Due date cannot be in the past.")
            
        return data

    def get_human_due(self, obj):#this makes the date human readable
        #like Wednesday, 01 Jan 2020 12:00 PM
        return obj.due_date.strftime("%b %d, %Y %I:%M %p") if obj.due_date else None


class TaskListSerializer(serializers.ModelSerializer,OwnerValidationMixin):
    class Meta:
        model = TaskList
        fields = '__all__'
        read_only_fields = ('id',)#there's a comma because it's a tuple, not a list or str

    def validate_project(self,project):#in serializers, validate_<field_name> is a field level validator
        self.validate_ownership(project, self.context['request'].user, "You do not have permission to create a task list for this project. You don't own it")
        return project


class LabelSerializer(serializers.ModelSerializer, OwnerValidationMixin):
    class Meta:
        model = Label
        fields = '__all__'
        read_only_fields = ('id',)

    def validate_project(self, project):
        self.validate_ownership(project, self.context['request'].user, "You do not have permission to create a label for this project. You don't own it")
        return project


class SubTaskSerializer(serializers.ModelSerializer):
    label = serializers.PrimaryKeyRelatedField(
        queryset=Label.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = SubTask
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, data):#this is an object level validator. checks if the label and task belong to the same project
        task = data.get('task', getattr(self.instance, 'task', None))
        label = data.get('label', getattr(self.instance, 'label', None))

        if label and task and label.project != task.task_list.project:
            raise serializers.ValidationError("Label and Task must belong to the same project.")
        return data


class TaskWithSubTasksSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)
    total_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'subtasks','title', 'description', 'task_list', 'labels', 'start_date', 'due_date', 'priority', 'position', 'total_minutes']
        
    def get_total_minutes(self, obj):
        return sum(entry.duration_minutes for entry in obj.time_entries.all())


class TaskListWithTasksSerializer(serializers.ModelSerializer):
    tasks = TaskWithSubTasksSerializer( many=True, read_only=True)

    class Meta:
        model = TaskList
        fields = '__all__'


class ProjectDetailSerializer(serializers.ModelSerializer):
    task_lists = TaskListWithTasksSerializer(many=True, read_only=True)
    subtasks = TaskWithSubTasksSerializer(many=True, read_only=True)
    # task_lists = TaskListSerializer(many = True, read_only=True)
    # tasks = serializers.SerializerMethodField()

    # def get_tasks(self, obj):
    #     task = Task.objects.filter(task_list__project=obj).order_by('-position')
    #     return TaskSerializer(task, many=True).data
    labels = LabelSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'  #fattens data



class TimeEntrySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='task.task_list.project.name', read_only=True)
    
    class Meta:
        model = TimeEntry
        fields = '__all__'
        read_only_fields = ('user', 'duration_minutes')
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ProjectActivitySerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True, allow_null=True)

    class Meta:
        model = ProjectActivity
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'project', 'user', 'task', 'activity_type', 'description', 'metadata')


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.CharField(source='uploaded_by.email', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True, allow_null=True)

    class Meta:
        model = Attachment
        fields = '__all__'
        read_only_fields = ('id', 'uploaded_at', 'uploaded_by', 'file_size', 'mime_type')
        
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['file_size'] = file_obj.size
            validated_data['mime_type'] = file_obj.content_type
            if not validated_data.get('file_name'):
                validated_data['file_name'] = file_obj.name
        return super().create(validated_data)


class RecurringTaskSerializer(serializers.ModelSerializer, OwnerValidationMixin):
    class Meta:
        model = RecurringTask
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate_project(self, project):
        self.validate_ownership(project, self.context['request'].user, "You do not have permission to create a recurring task for this project.")
        return project

