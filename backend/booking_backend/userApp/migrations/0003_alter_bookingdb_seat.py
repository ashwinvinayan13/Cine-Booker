# Generated by Django 5.1.6 on 2025-03-12 06:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userApp', '0002_rename_booking_bookingdb'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bookingdb',
            name='seat',
            field=models.IntegerField(),
        ),
    ]
