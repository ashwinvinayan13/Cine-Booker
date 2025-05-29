from rest_framework import serializers
from .models import MovieDb, ShowDb, SeatDb

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
    class Meta:
        model = SeatDb
        fields = '__all__' 