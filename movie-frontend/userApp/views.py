from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from adminApp.models import ShowDb
from adminApp.serializers import ShowSerializer
from django.contrib.auth.models import User

class UserShowListView(generics.ListAPIView):
    serializer_class = ShowSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShowDb.objects.all()

class UserShowDetailView(generics.RetrieveAPIView):
    serializer_class = ShowSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = ShowDb.objects.all()

class ShowBookedSeatsView(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = ShowDb.objects.all()

    def get(self, request, pk):
        show = self.get_object()
        booked_seats = show.seats.filter(is_booked=True).values_list('seat_number', flat=True)
        return Response({'booked_seats': list(booked_seats)})

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response({"error": "Username, email and password are required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=400)

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            return Response({"message": "User registered successfully"}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400) 