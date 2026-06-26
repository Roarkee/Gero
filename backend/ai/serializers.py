from ai.models import AIRequest
from rest_framework import serializers


class AIRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = AIRequest
        fields = "__all__"
        read_only_fields = ["user"]