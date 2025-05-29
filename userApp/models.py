from django.db import models
from django.contrib.auth.models import User
from adminApp.models import ShowDb, SeatDb

# Create your models here.


class BookingDb(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    show = models.ForeignKey(ShowDb, on_delete=models.CASCADE)
    seat = models.OneToOneField(SeatDb, on_delete=models.CASCADE)
    booked_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Booking by {self.user.username} for {self.seat.seat_number} at {self.show.show_time}"

