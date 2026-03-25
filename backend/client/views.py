from rest_framework import generics,permissions
from client.serializers import ClientSerializer, ClientOverviewSerializier


# Create your views here.

class ClientView(generics.ListCreateAPIView):#this allows a user to create a client
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientSerializer
    

    def get_queryset(self):
        user = self.request.user
        return user.clients.all().order_by('-created_at')
    
class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):#this allows a user to update or delete a client
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientSerializer

    def get_queryset(self):#thus makes sure a user can only access their own clients
        user = self.request.user
        return user.clients.all().order_by('-created_at')

    def get_object(self):#this method is used to get the object based on the primary key
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs['pk'])
        return obj
    
class ClientOverviewView(generics.RetrieveAPIView):#this view return the clients that the user has created
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClientOverviewSerializier

    def get_queryset(self):
        return self.request.user.clients.all().order_by('-created_at')
