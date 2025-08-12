from rest_framework import serializers
from .models import Expense, ExpenseCategory, Budget
from django.db.models import Sum
from django.utils import timezone


class ExpenseCategorySerializer(serializers.ModelSerializer):
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpenseCategory
        fields = '__all__'
        read_only_fields = ('user',)
    
    def get_total_spent(self, obj):
        return obj.expenses.aggregate(total=Sum('amount'))['total'] or 0
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    spent_amount = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    is_over_budget = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('user',)
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('user',)
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)