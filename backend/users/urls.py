from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView
from django.urls import path
from users.views import RegisterView, Logout, UserProfile


urlpatterns =[
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', Logout.as_view(), name='logout'),
    path('profile/', UserProfile.as_view(), name='profile'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

