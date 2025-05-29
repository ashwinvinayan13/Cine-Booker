from django.urls import path, include
from rest_framework.routers import DefaultRouter
from adminApp import views

router = DefaultRouter()
router.register('movies', views.MovieView, basename="movie")
router.register('shows', views.ShowView, basename="show")
router.register('seats', views.SeatView, basename="seat")
router.register('bookings', views.BookingView, basename="booking")

urlpatterns = [
    path('', include(router.urls)),
    path('movie_view/', views.UserMovieView.as_view(), name='movie_view'),
    path('verify-superuser/', views.verify_superuser, name='verify_superuser'),
    path('auth/login/', views.login_view, name='login'),
]
