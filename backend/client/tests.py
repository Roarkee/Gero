from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from client.models import Client
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class ClientAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='chris@example.com', password='testpass123')
        self.other_user = User.objects.create_user(email='other@example.com', password='otherpass123')

        self.client1 = Client.objects.create(user=self.user, name='Client A', email='a@example.com')
        self.client2 = Client.objects.create(user=self.user, name='Client B', email='b@example.com')
        self.other_client = Client.objects.create(user=self.other_user, name='Other Client', email='x@example.com')

        # Get JWT tokens
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}

        self.list_create_url = reverse('client-list')  # 'client-list' = name of the ListCreateAPIView URL
        self.detail_url = lambda pk: reverse('client-detail', kwargs={'pk': pk})  # dynamic

    def test_list_clients(self):
        response = self.client.get(self.list_create_url, **self.auth_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertTrue(all(item['name'] in ['Client A', 'Client B'] for item in response.data))

    def test_create_client(self):
        data = {
            'name': 'New Client',
            'email': 'new@example.com',
            'phone_number': '1234567890',
            'company_name': 'Test Inc'
        }
        response = self.client.post(self.list_create_url, data, **self.auth_headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Client.objects.filter(user=self.user).count(), 3)
        self.assertEqual(response.data['name'], 'New Client')

    def test_retrieve_own_client(self):
        response = self.client.get(self.detail_url(self.client1.id), **self.auth_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.client1.name)

    def test_retrieve_other_users_client_forbidden(self):
        response = self.client.get(self.detail_url(self.other_client.id), **self.auth_headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_client(self):
        data = {
            'name': 'Updated Client A',
            'email': 'updated@example.com',
            'phone_number': '555',
            'company_name': 'Updated Ltd'
        }
        response = self.client.put(self.detail_url(self.client1.id), data, **self.auth_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client1.refresh_from_db()
        self.assertEqual(self.client1.name, 'Updated Client A')

    def test_delete_client(self):
        response = self.client.delete(self.detail_url(self.client2.id), **self.auth_headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Client.objects.filter(id=self.client2.id).exists())
