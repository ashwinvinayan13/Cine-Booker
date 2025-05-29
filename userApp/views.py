from django.shortcuts import get_object_or_404
from userApp.models import BookingDb, SeatDb
from userApp.serializers import BookingSerializer
from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from adminApp.serializers import MovieSerializer, ShowSerializer
from adminApp.models import MovieDb, ShowDb


# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'})

    user = User(username=username)
    user.set_password(password)
    user.save()

    return Response({'message': 'User registered succesfully'})


class UserMovieListView(generics.ListAPIView):
    queryset = MovieDb.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]


class UserMovieDetailView(generics.RetrieveAPIView):
    queryset = MovieDb.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]


class UserMovieShowsView(generics.ListAPIView):
    serializer_class = ShowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        movie_id = self.kwargs.get('pk')
        return ShowDb.objects.filter(movie_id=movie_id)


class UserShowListView(generics.ListAPIView):
    queryset = ShowDb.objects.all()
    serializer_class = ShowSerializer
    permission_classes = [IsAuthenticated]


class UserShowDetailView(generics.RetrieveAPIView):
    queryset = ShowDb.objects.all()
    serializer_class = ShowSerializer
    permission_classes = [IsAuthenticated]


class ShowBookedSeatsView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        show = get_object_or_404(ShowDb, pk=pk)
        booked_seats = SeatDb.objects.filter(show=show, is_booked=True)
        return Response({
            'booked_seats': list(booked_seats.values_list('id', flat=True))
        })


class BookingViewSet(viewsets.ModelViewSet):
    queryset = BookingDb.objects.all()
    serializer_class = BookingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        show_id = request.data.get('show')
        seat_id = request.data.get('seat')
        user = request.user

        if not show_id or not seat_id:
            return Response(
                {'error': 'Both show and seat are required'}
            )
        try:
            with transaction.atomic():
                show = ShowDb.objects.get(id=show_id)
                seat = SeatDb.objects.select_for_update().get(id=seat_id)
                if seat.is_booked:
                    return Response(
                        {'error': 'This seat is already booked'}
                    )
                booking = BookingDb.objects.create(
                    user=user,
                    show=show,
                    seat=seat
                )
                seat.is_booked = True
                seat.save()
                serializer = self.get_serializer(booking)
                return Response({
                    'message': 'Ticket booked successfully',
                    'booking': serializer.data
                }, status=201)
        except ShowDb.DoesNotExist:
            return Response(
                {'error': 'Show not found'},
                status=404
            )
        except SeatDb.DoesNotExist:
            return Response(
                {'error': 'Seat not found'},
                status=404
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=500
            )


    def destroy(self, request, *args, **kwargs):
        booking = self.get_object()
        seat = booking.seat

        with transaction.atomic():
            seat.is_booked = False
            seat.save()
            booking.delete()

        return Response({'message': 'Booking Cancelled'})

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'bookings': serializer.data
        })