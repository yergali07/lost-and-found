from django.urls import path

from . import views

urlpatterns = [
    path('auth/register/', views.register_view, name='register'),
]
