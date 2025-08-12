
from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class UserAuthTests(APITestCase):

    def setUp(self):
        self.register_url = reverse('register')  
        self.login_url = reverse('token_obtain_pair') 
        self.logout_url = reverse('logout')  
        self.profile_url = reverse('profile')  

        self.user_data = {
            "email": "test@example.com",
            "password": "strongpassword123"
        }

    def get_tokens_for_user(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.user_data["email"]).exists())

    def test_user_login(self):
        User.objects.create_user(**self.user_data)
        response = self.client.post(self.login_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_logout_with_valid_refresh_token(self):
        user = User.objects.create_user(**self.user_data)
        tokens = self.get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access']) 
        response = self.client.post(self.logout_url, {"refresh": tokens["refresh"]})
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    

    def test_profile_view_authenticated(self):
        user = User.objects.create_user(**self.user_data)
        tokens = self.get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user_data["email"])

    def test_profile_update_authenticated(self):
        user = User.objects.create_user(**self.user_data)
        tokens = self.get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])
        response = self.client.put(self.profile_url, {
            "email": "newemail@example.com",
            "password": "newstrongpassword"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "newemail@example.com")
