from rest_framework import generics, permissions, views, status
from rest_framework.response import Response
from users.serializers import UserSerializer, MyTokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

# for google sign in
from google.oauth2 import id_token
from google.auth.transport import requests
from users.models import User
from django.conf import settings
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

class ForgotPassword(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        pass
    

#atm this view is not being used
#in case i want to add more claims(email, first name) to my jwt then i'd use this view
#for now i'd just stick with the default 
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class GoogleLogin(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # this is the token that google will send to the frontend which we the backend will verify
        # in case someone tampers with it from the frontend
        token = request.data.get('token')

        if not token:
            return Response(
                { "error":"no token provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            idinfo = id_token.verify_oauth2_token(token,requests.Request(), settings.GOOGLE_CLIENT_ID)
            if not idinfo.get("email_verified"):
                return Response(
                    {"error": "Google email not verified"},
                    status=400
                )
            
            email = idinfo.get("email")
            
            if not email:
                return Response({"error": "No email could be fetched bad"}, status=status.HTTP_400_BAD_REQUEST)
        
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
            provider_id = idinfo.get("sub")

            
            # either get the user or create a new one
            user, created = User.objects.get_or_create(
                email = email,
                defaults = {
                    "first_name": first_name,
                    "last_name": last_name,
                    "provider": "google",
                    "provider_id": provider_id,
                }
            )

            # this is where the user has signed in with email and password only and now chooses to sign in with google
            # in this case, you link the email and password sign in with the google sign in so that he can use both

            if not created:
                user.provider = "google"
                user.provider_id = provider_id
                user.save()

            # if he signs in with google, set the password field to be unusable
            if created:
                user.set_unusable_password()
                user.save()

            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            refresh = RefreshToken.for_user(user)

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
            })

        except ValueError:
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_400_BAD_REQUEST
            )




    

    



class AcceptInvite(views.APIView):
    """
    Called from the frontend /portal/accept-invite page.
    Validates the uid + token, sets the client's password,
    and returns JWT tokens so the client is immediately logged in.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')

        if not token or not password:
            return Response(
                {'detail': 'token and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from client.models import ClientInvitation
        
        try:
            invitation = ClientInvitation.objects.get(token=token)
        except (ClientInvitation.DoesNotExist, ValueError):
            return Response({'detail': 'Invalid invitation link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not invitation.is_valid():
            return Response({'detail': 'This invitation link has expired or already been used.'}, status=status.HTTP_400_BAD_REQUEST)

        # Invitation is valid. Set password on the linked user account.
        user = invitation.client.user_account
        if not user:
             return Response({'detail': 'No user account linked to this invitation.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set password and activate
        user.set_password(password)
        user.is_active = True
        user.is_client = True
        user.save()
        
        # Mark invite as accepted
        invitation.is_accepted = True
        invitation.save(update_fields=['is_accepted'])

        # Return JWT so they're logged in immediately
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'role': user.role,
                'is_freelancer': user.is_freelancer,
                'is_client': user.is_client,
            },
        })
