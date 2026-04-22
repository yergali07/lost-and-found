from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Category, Item, Claim


MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_CONTENT_TYPES = ('image/jpeg', 'image/png', 'image/webp')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    clear_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Item
        fields = [
            'id',
            'title',
            'description',
            'item_type',
            'status',
            'location',
            'date_lost_or_found',
            'image',
            'clear_image',
            'created_at',
            'updated_at',
            'owner',
            'owner_username',
            'category',
            'category_name',
        ]
        read_only_fields = ['owner', 'status', 'created_at', 'updated_at']
        extra_kwargs = {
            'image': {'required': False},
        }

    def validate_image(self, value):
        if value in (None, ''):
            return value
        if value.size > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError(
                f'Image must be smaller than {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.'
            )
        content_type = getattr(value, 'content_type', None)
        if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
            raise serializers.ValidationError(
                'Image must be a JPEG, PNG, or WebP file.'
            )
        return value

    def create(self, validated_data):
        validated_data.pop('clear_image', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        clear_image = validated_data.pop('clear_image', False)
        # An incoming new image takes precedence over the clear flag.
        if clear_image and not validated_data.get('image') and instance.image:
            instance.image.delete(save=False)
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class ClaimSerializer(serializers.ModelSerializer):
    claimant_username = serializers.CharField(source='claimant.username', read_only=True)
    item_title = serializers.CharField(source='item.title', read_only=True)
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    claimant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Claim
        fields = [
            'id',
            'message',
            'status',
            'created_at',
            'updated_at',
            'claimant',
            'claimant_username',
            'item',
            'item_title',
        ]
        read_only_fields = ['claimant', 'status', 'created_at', 'updated_at']
