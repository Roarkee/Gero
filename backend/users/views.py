from rest_framework import generics, permissions
from rest_framework.response import Response
from users.serializers import UserSerializer,MyTokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
# Create your views here.

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer


class Logout(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self,request):
        try:
            RefreshToken(request.data['refresh']).blacklist()
            return Response({"message": "Successfully logged out"}, status=204)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
class UserProfile(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
    

#atm this view is not being used
#in case i want to add more claims(email, first name) to my jwt then i'd use this view
#for now i'd just stick with the default 
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    

    

