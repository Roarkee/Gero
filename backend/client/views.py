from rest_framework import views, permissions,filters, status
from rest_framework.response import Response
from .models import Client
from .serializers import ClientSerializer, ClientDetailSerializer,ClientListSerializer
from django.http import Http404
from client.services import ClientIntelligenceService


class ClientView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'company_name']
    ordering_fields = ['created_at', 'name']

    def get(self, request):
        clients = Client.objects.filter(user = request.user)
        serializer = ClientListSerializer(clients, many = True)
        return Response(serializer.data)

    
    def post(self,request):
        serializer = ClientSerializer(data = request.data,context = {'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ClientDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self, pk):
        try:
            return Client.objects.get(pk = pk, user = self.request.user)
        except Client.DoesNotExist:
            raise Http404


    def get(self, request, pk):
        client = self.get_object(pk)
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)
    
    def put(self, request, pk, format=None):
        snippet = self.get_object(pk)
        serializer = ClientSerializer(snippet, data=request.data,context = {'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class ClientIntelligenceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        data = (
            ClientIntelligenceService
            .get_dashboard_intelligence(request.user)
        )

        return Response(data)
    
 

class ClientDetailIntelligenceView(views.APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):

        client = Client.objects.get(
            pk=pk,
            user=request.user
        )

        data = (
            ClientIntelligenceService
            .get_full_client_intelligence(client)
        )

        return Response(data)

