from rest_framework import serializers
from projects.models import Project, Task, TaskList, Label, SubTask, TimeEntry
from datetime import datetime
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
    duedate = serializers.DateTimeField(input_formats=datetime_formats)
    startdate = serializers.DateTimeField(input_formats=datetime_formats)
    human_due = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, data):#this checks if the dates are in the data passed before going to the conditionals
        start = data.get('startdate', getattr(self.instance, 'startdate', None))# getattr is used to get the
        #value of startdate from the Task if it exists, otherwise it returns None
        due = data.get('duedate', getattr(self.instance, 'duedate', None))

        if start and due:
            if start > due:
                raise serializers.ValidationError("Start date cannot be after due date.")
            if start < datetime.now():
                raise serializers.ValidationError("Start date cannot be in the past.")
            if due < datetime.now():
                raise serializers.ValidationError("Due date cannot be in the past.")
            
        return data

    def get_human_due(self, obj):#this makes the date human readable
        #like Wednesday, 01 Jan 2020 12:00 PM
        return obj.duedate.strftime("%b %d, %Y %I:%M %p") if obj.duedate else None


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

        if label and task and label.project != task.project:
            raise serializers.ValidationError("Label and Task must belong to the same project.")
        return data


class TaskWithSubTasksSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = ['subtasks','title', 'description', 'task_list', 'labels', 'startdate', 'duedate']


class TaskListWithTasksSerializer(serializers.ModelSerializer):
    tasks = TaskWithSubTasksSerializer( many=True, read_only=True)

    class Meta:
        model = TaskList
        fields = '__all__'


class ProjectDetailSerializer(serializers.ModelSerializer):
    task_lists = TaskListWithTasksSerializer(many=True, read_only=True)
    labels = LabelSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'


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


