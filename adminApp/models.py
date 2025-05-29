from django.db import models

# Create your models here.


class MovieDb(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    poster = models.ImageField(upload_to='posters')
    duration = models.PositiveIntegerField(help_text="Duration in minutes")

    def __str__(self):
        return self.titlen


class ShowDb(models.Model):
    movie = models.ForeignKey(MovieDb, on_delete=models.CASCADE, related_name="shows")
    show_time = models.DateTimeField()

    def available_seats_count(self):
        return self.seats.filter(is_booked=False).count()


class SeatDb(models.Model):
    show = models.ForeignKey(ShowDb, on_delete=models.CASCADE, related_name="seats")
    seat_number = models.IntegerField()
    is_booked = models.BooleanField(default=False)

    class Meta:
        unique_together = ('show', 'seat_number')
