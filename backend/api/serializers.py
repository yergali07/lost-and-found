from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Category, Item, Claim


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Item
        fields = '__all__'
        read_only_fields = ['owner']
        extra_kwargs = {
            'image': {'required': False},
        }


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class ClaimSerializer(serializers.ModelSerializer):
    claimant = serializers.StringRelatedField(source='claimant.username', read_only=True)
    item = serializers.StringRelatedField(source='item.title', read_only=True)

    class Meta:
        model = Claim
        fields = ['id', 'message', 'status', 'created_at', 'claimant', 'item']
        read_only_fields = ['claimant', 'status', 'created_at']