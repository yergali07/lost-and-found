from django.contrib.auth.models import User
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Item(models.Model):
    class ItemType(models.TextChoices):
        LOST = 'lost', 'Lost'
        FOUND = 'found', 'Found'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        CLAIMED = 'claimed', 'Claimed'
        RESOLVED = 'resolved', 'Resolved'

    title = models.CharField(max_length=255)
    description = models.TextField()
    item_type = models.CharField(max_length=5, choices=ItemType.choices)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.ACTIVE)
    location = models.CharField(max_length=255)
    date_lost_or_found = models.DateField()
    image_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
