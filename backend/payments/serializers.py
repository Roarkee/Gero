from rest_framework import serializers
import json
from .models import PaymentProvider

class PaymentProviderSerializer(serializers.ModelSerializer):
    provider_type = serializers.CharField(source='provider')

    class Meta:
        model = PaymentProvider
        fields = ['id', 'user', 'provider_type', 'display_name', 'is_active', 'is_test_mode', 'encrypted_config', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_encrypted_config(self, value):
        try:
            config = json.loads(value)
        except json.JSONDecodeError:
            raise serializers.ValidationError("Must be a valid JSON string.")
        
        # We need the provider_type to validate the config content.
        # It's not available in this method directly, so we'll do the detailed 
        # validation in the general validate() method.
        return value

    def validate(self, data):
        # We need to account for both create and update operations
        provider_type = data.get('provider_type') or (self.instance.provider_type if self.instance else None)
        encrypted_config = data.get('encrypted_config')
        
        if encrypted_config:
            try:
                config = json.loads(encrypted_config)
            except json.JSONDecodeError:
                raise serializers.ValidationError({"encrypted_config": "Must be a valid JSON string."})

            if provider_type == 'mtn_momo':
                if 'phone_number' not in config or 'account_name' not in config:
                    raise serializers.ValidationError({"encrypted_config": "MTN Mobile Money requires 'phone_number' and 'account_name'."})
            elif provider_type == 'bank':
                if 'bank_name' not in config or 'account_number' not in config or 'account_name' not in config:
                    raise serializers.ValidationError({"encrypted_config": "Bank Transfer requires 'bank_name', 'account_number', and 'account_name'."})
            elif provider_type == 'paystack':
                if 'secret_key' not in config:
                    raise serializers.ValidationError({"encrypted_config": "Paystack requires 'secret_key'."})
        
        return data


class PaymentTransactionSerializer(serializers.ModelSerializer):
    fields = "__all__"
    read_only_fields = ["created_at", "processed_at", "id", "net_amount", "provider_reference"]

    def validate_amount(self):
        pass
