from rest_framework import viewsets, permissions,filters
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]


    def get_queryset(self):
        # Only show the freelancer's own clients
        return Client.objects.filter(user=self.request.user).order_by('-created_at')

    serializer_class = ClientSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)