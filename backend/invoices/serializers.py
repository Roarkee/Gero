from rest_framework import serializers
from django.db import transaction
from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    # Expose id as writable so the frontend can reference existing items
    id = serializers.IntegerField(required=False)

    class Meta:
        model = InvoiceItem
        fields = ('id', 'description', 'quantity', 'rate', 'amount', 'time_entries')
        read_only_fields = ('amount',)


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source='client.name', read_only=True)
    # Allow null project without crashing on .name access
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('user', 'subtotal', 'tax_amount', 'total_amount', 'sequence_number', 'invoice_number')

    def get_project_name(self, obj):
        return obj.project.name if obj.project_id else None

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        items_data = validated_data.pop('items', [])

        with transaction.atomic():
            # Invoice.save() handles sequence_number and invoice_number generation internally
            invoice = super().create(validated_data)

            for item_data in items_data:
                item_data.pop('id', None)
                item_data.pop('invoice', None)
                InvoiceItem.objects.create(invoice=invoice, **item_data)

            # Trigger recalculate_totals now that items exist
            invoice.save()

        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        with transaction.atomic():
            # Update scalar invoice fields directly — do NOT call super().update()
            # because that triggers Invoice.save() before items are settled.
            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            if items_data is not None:
                existing_items = {item.id: item for item in instance.items.all()}
                incoming_ids = []

                for item_data in items_data:
                    item_id = item_data.get('id')
                    # Strip keys that aren't item fields
                    item_data.pop('invoice', None)

                    if item_id and item_id in existing_items:
                        item_obj = existing_items[item_id]
                        for attr, value in item_data.items():
                            if attr != 'id':
                                setattr(item_obj, attr, value)
                        # Use InvoiceItem.save() which calls full_clean + calculate_amount
                        item_obj.save()
                        incoming_ids.append(item_id)
                    else:
                        item_data.pop('id', None)
                        new_item = InvoiceItem.objects.create(invoice=instance, **item_data)
                        incoming_ids.append(new_item.id)

                # Delete removed items directly — bypass InvoiceItem.delete() to avoid
                # it triggering premature recalculate_totals mid-loop
                orphan_ids = [iid for iid in existing_items if iid not in incoming_ids]
                if orphan_ids:
                    InvoiceItem.objects.filter(id__in=orphan_ids).delete()

            # One single save at the end: recalculate_totals → full_clean → DB write
            instance.save()

        return instance


class InvoiceListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'title', 'client_name', 'project_name',
                  'total_amount', 'status', 'due_date', 'created_at',
                  'paid_date', 'issue_date']

    def get_project_name(self, obj):
        return obj.project.name if obj.project_id else None