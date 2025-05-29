from rest_framework import serializers
from adminApp.models import MovieDb, ShowDb, SeatDb
from userApp.models import BookingDb
from django.contrib.auth.models import User



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']



class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieDb
        fields = '__all__'



class ShowSerializer(serializers.ModelSerializer):
    movie = MovieSerializer()

    class Meta:
        model = ShowDb
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingDb
        fields = '__all__'



class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeatDb
        fields = '__all__'