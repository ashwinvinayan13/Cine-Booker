from django.urls import path, include
from rest_framework.routers import DefaultRouter
from userApp.views import register_user, BookingViewSet
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from userApp import views



router = DefaultRouter()
router.register('bookings', BookingViewSet, basename='bookings')




urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('movies/', views.UserMovieListView.as_view(), name='user_movie_list'),
    path('movies/<int:pk>/', views.UserMovieDetailView.as_view(), name='user_movie_detail'),
    path('movies/<int:pk>/shows/', views.UserMovieShowsView.as_view(), name='user_movie_shows'),
    path('shows/', views.UserShowListView.as_view(), name='user_show_list'),
    path('shows/<int:pk>/', views.UserShowDetailView.as_view(), name='user_show_detail'),
    path('shows/<int:pk>/booked-seats/', views.ShowBookedSeatsView.as_view(), name='show_booked_seats'),
]