from rest_framework import serializers
from .models import User,Media

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'user_type', 'created_by','created_at']




class DataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = '__all__'
