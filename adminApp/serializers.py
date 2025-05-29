from rest_framework import serializers
from adminApp.models import MovieDb, ShowDb, SeatDb
from userApp.models import BookingDb

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieDb
        fields = '__all__'


class ShowSerializer(serializers.ModelSerializer):
    total_seats = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()
    
    class Meta:
        model = ShowDb
        fields = ['id', 'movie', 'show_time', 'total_seats', 'available_seats']

    def get_total_seats(self, obj):
        return obj.seats.count()

    def get_available_seats(self, obj):
        return obj.available_seats_count()



class SeatSerializer(serializers.ModelSerializer):
    show_details = serializers.SerializerMethodField()
    
    class Meta:
        model = SeatDb
        fields = ['id', 'seat_number', 'is_booked', 'show', 'show_details']
    
    def get_show_details(self, obj):
        return {
            'id': obj.show.id,
            'show_time': obj.show.show_time,
            'movie_title': obj.show.movie.title,
            'movie_id': obj.show.movie.id
        }


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingDb
        fields = ['id', 'user', 'show', 'seat', 'booked_at']
        read_only_fields = ['user', 'booked_at']

