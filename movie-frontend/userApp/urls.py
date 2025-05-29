from django.urls import path
from .views import UserShowListView, UserShowDetailView, ShowBookedSeatsView, UserRegistrationView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('shows/', UserShowListView.as_view(), name='user-shows-list'),
    path('shows/<int:pk>/', UserShowDetailView.as_view(), name='user-show-detail'),
    path('shows/<int:pk>/booked-seats/', ShowBookedSeatsView.as_view(), name='show-booked-seats'),
] 