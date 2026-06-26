from rest_framework import viewsets, permissions
from .models import PaymentProvider
from .serializers import PaymentProviderSerializer

class PaymentProviderViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentProviderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict queryset to request.user only
        return PaymentProvider.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically attach the user to the provider
        serializer.save(user=self.request.user)
