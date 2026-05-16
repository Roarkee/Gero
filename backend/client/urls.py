from django.urls import path
from .views import (
    ClientIntelligenceView,
    ClientDetailIntelligenceView,
    ClientDetailView,
    ClientView


)

urlpatterns = [

      path(
        "intelligence/",
        ClientIntelligenceView.as_view(),
        name="client-intelligence"
    ),

    path(
        "<int:pk>/intelligence/",
        ClientDetailIntelligenceView.as_view(),
        name="client-detail-intelligence"
    ),

    path("client/", ClientView.as_view(), name="client"),
    path("client/<int:pk>/", ClientDetailView.as_view(), name="client-detail")
    
]