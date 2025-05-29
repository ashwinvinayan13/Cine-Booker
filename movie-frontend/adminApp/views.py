from django.shortcuts import render
from rest_framework import viewsets
from adminApp.models import MovieDb, SeatDb, ShowDb
from adminApp.serializers import MovieSerializer, ShowSerializer, SeatSerializer
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

# Create your views here.

class MovieView(viewsets.ModelViewSet):
    serializer_class = MovieSerializer
    queryset = MovieDb.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        # Return all movies, regardless of who created them
        return MovieDb.objects.all()

class ShowView(viewsets.ModelViewSet):
    serializer_class = ShowSerializer
    queryset = ShowDb.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        # Return all shows, regardless of who created them
        return ShowDb.objects.all()

class UserShowView(viewsets.ReadOnlyModelViewSet):
    serializer_class = ShowSerializer
    queryset = ShowDb.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShowDb.objects.all()

    @api_view(['GET'])
    def get_booked_seats(self, request, pk):
        show = self.get_object()
        booked_seats = show.seats.filter(is_booked=True).values_list('seat_number', flat=True)
        return Response({'booked_seats': list(booked_seats)})

class SeatView(viewsets.ModelViewSet):
    serializer_class = SeatSerializer
    queryset = SeatDb.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        # Return all seats, regardless of who created them
        return SeatDb.objects.all()

@api_view(['POST'])
def register_admin(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"error": "Username and password are required"})

    if User.objects.filter(username=username).exists():
        return Response({"error": "Admin user already exists"})

    # Create admin user
    user = User.objects.create_superuser(username=username, password=password)

    return Response({"message": "Admin registered successfully"}) 