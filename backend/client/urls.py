from django.urls import path
from client.views import ClientView, ClientDetailView, ClientOverviewView

urlpatterns =[
    path('clients/', ClientView.as_view(), name='client-list'),
    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),
    path('clients/<int:pk>/overview/', ClientOverviewView.as_view(), name='client-overview'),
]