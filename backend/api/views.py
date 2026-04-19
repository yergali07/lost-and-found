from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Category, Item, Claim
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    CategorySerializer,
    ItemSerializer,
    RegisterSerializer,
    UserSerializer,
    ClaimSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {'detail': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response(
            {'detail': 'Refresh token is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        return Response(
            {'detail': 'Invalid or expired token.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class CategoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ItemListCreateAPIView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        queryset = Item.objects.select_related('category', 'owner').all()

        item_type = request.query_params.get('item_type')
        if item_type:
            queryset = queryset.filter(item_type=item_type)

        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        item_status = request.query_params.get('status')
        if item_status:
            queryset = queryset.filter(status=item_status)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        serializer = ItemSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ItemSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ItemDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_object(self, pk):
        try:
            item = Item.objects.select_related('category', 'owner').get(pk=pk)
        except Item.DoesNotExist:
            return None
        self.check_object_permissions(self.request, item)
        return item

    def get(self, request, pk):
        item = self.get_object(pk)
        if item is None:
            return Response(
                {'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ItemSerializer(item, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        item = self.get_object(pk)
        if item is None:
            return Response(
                {'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ItemSerializer(item, data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        item = self.get_object(pk)
        if item is None:
            return Response(
                {'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ItemSerializer(item, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        item = self.get_object(pk)
        if item is None:
            return Response(
                {'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyItemsListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Item.objects.select_related('category', 'owner').filter(
            owner=request.user
        )
        serializer = ItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_resolved_view(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response(
            {'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND
        )

    if item.owner != request.user:
        return Response(
            {'detail': 'You do not have permission to perform this action.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    item.status = Item.Status.RESOLVED
    item.save(update_fields=['status', 'updated_at'])
    serializer = ItemSerializer(item, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


class ClaimListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        claims = Claim.objects.select_related('claimant', 'item').all()
        serializer = ClaimSerializer(claims, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        request_user = request.user
        item_id = request.data.get('item')
        
        try:
            item = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response(
                {'detail': 'Item not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Проверка: пользователь не может подать заявку на свой предмет
        if item.owner == request_user:
            return Response(
                {'detail': 'You cannot claim your own item.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка: повторные pending заявки запрещены
        if Claim.objects.filter(claimant=request_user, item=item, status='pending').exists():
            return Response(
                {'detail': 'You already have a pending claim for this item.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка: заявки только на 'active' предметы
        if item.status != Item.Status.ACTIVE:
            return Response(
                {'detail': 'You can only claim items with status "active".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ClaimSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(claimant=request_user, item=item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyClaimsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        claims = Claim.objects.select_related('claimant', 'item').filter(
            claimant=request.user
        )
        serializer = ClaimSerializer(claims, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ItemClaimsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_items = Item.objects.filter(owner=request.user)
        claims = Claim.objects.select_related('claimant', 'item').filter(
            item__in=user_items
        )
        serializer = ClaimSerializer(claims, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)