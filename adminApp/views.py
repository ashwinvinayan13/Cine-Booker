from django.shortcuts import render
from rest_framework import viewsets, status
from adminApp.models import MovieDb, SeatDb, ShowDb
from adminApp.serializers import MovieSerializer, ShowSerializer, SeatSerializer, BookingSerializer
from userApp.models import BookingDb
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import generics
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        is_admin = request.data.get('is_admin', False)

        print(f"Login attempt - Username: {username}, Is Admin: {is_admin}")

        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},

            )

        user = authenticate(username=username, password=password)
        
        if not user:
            print(f"Authentication failed for username: {username}")
            return Response(
                {'error': 'Invalid credentials'},

            )

        print(f"User authenticated: {user.username}, Is Superuser: {user.is_superuser}")

        # Check if user is trying to login as admin
        if is_admin and not user.is_superuser:
            print(f"Admin access denied for user: {user.username}")
            return Response(
                {'error': 'Access denied. Only administrators can access this area.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'username': user.username,
                'is_admin': user.is_superuser,
                'is_superuser': user.is_superuser
            }
        }
        
        print(f"Login successful for user: {user.username}")
        return Response(response_data)
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return Response(
            {'error': 'An error occurred during login'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_superuser(request):
    if not request.user.is_authenticated:
        return Response({'is_superuser': False}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'is_superuser': request.user.is_superuser,
        'username': request.user.username
    })

class UserMovieView(generics.ListAPIView):
    queryset = MovieDb.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]



class  MovieView(viewsets.ModelViewSet):
    serializer_class = MovieSerializer
    queryset = MovieDb.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return MovieDb.objects.all()


class ShowView(viewsets.ModelViewSet):
    serializer_class = ShowSerializer
    queryset = ShowDb.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return ShowDb.objects.all()

class SeatView(viewsets.ModelViewSet):
    serializer_class = SeatSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
    queryset = SeatDb.objects.all()

    def get_queryset(self):
        show_id = self.request.query_params.get('show_id', None)
        if not show_id:
            return SeatDb.objects.none()
        return SeatDb.objects.filter(show_id=show_id).order_by('seat_number')

    def list(self, request, *args, **kwargs):
        show_id = request.query_params.get('show_id', None)
        if not show_id:
            return Response({"error": "show_id is required"}, status=400)
        
        seats = self.get_queryset()
        serializer = self.get_serializer(seats, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def show_seats(self, request):
        show_id = request.query_params.get('show_id', None)
        if not show_id:
            return Response({"error": "show_id is required"}, status=400)
        
        seats = SeatDb.objects.filter(show_id=show_id).order_by('seat_number')
        serializer = self.get_serializer(seats, many=True)
        return Response(serializer.data)


class BookingView(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BookingDb.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        show_id = request.data.get('show')
        seat_id = request.data.get('seat')

        try:
            show = ShowDb.objects.get(id=show_id)
            seat = SeatDb.objects.get(id=seat_id, show=show)

            if seat.is_booked:
                return Response(
                    {"error": "This seat is already booked"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # Create the booking
                booking = BookingDb.objects.create(
                    user=request.user,
                    show=show,
                    seat=seat
                )
                # Mark the seat as booked
                seat.is_booked = True
                seat.save()

                serializer = self.get_serializer(booking)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ShowDb.DoesNotExist:
            return Response(
                {"error": "Show not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except SeatDb.DoesNotExist:
            return Response(
                {"error": "Seat not found or not available for this show"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
