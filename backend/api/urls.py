from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.MeAPIView.as_view(), name='me'),
    path('auth/change-password/', views.change_password_view, name='change-password'),
    path('health/', views.health_check, name='health_check'),
    path('categories/', views.CategoryListAPIView.as_view(), name='category-list'),
    path('items/', views.ItemListCreateAPIView.as_view(), name='item-list-create'),
    path('items/me/', views.MyItemsListAPIView.as_view(), name='my-items'),
    path('items/<int:pk>/', views.ItemDetailAPIView.as_view(), name='item-detail'),
    path('items/<int:pk>/mark-resolved/', views.mark_resolved_view, name='item-mark-resolved'),
    path('items/<int:pk>/comments/', views.ItemCommentsAPIView.as_view(), name='item-comments'),
    path('comments/<int:pk>/', views.delete_comment_view, name='comment-delete'),
    path('claims/', views.ClaimCreateAPIView.as_view(), name='claim-create'),
    path('claims/me/', views.MyClaimsListAPIView.as_view(), name='my-claims'),
    path('claims/items/', views.MyItemClaimsListAPIView.as_view(), name='my-item-claims'),
    path('claims/<int:pk>/approve/', views.approve_claim, name='claim-approve'),
    path('claims/<int:pk>/reject/', views.reject_claim, name='claim-reject'),
]
