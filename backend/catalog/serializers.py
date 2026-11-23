from rest_framework import serializers

from .models import Category, Service, ServiceRequest


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id", "category", "category_name", "name", "description", "price",
            "duration_minutes", "is_available", "created_at",
        ]


class ServiceRequestSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        source="service", queryset=Service.objects.all()
    )

    class Meta:
        model = ServiceRequest
        fields = ["id", "service_id", "client_name", "phone", "desired_at", "status", "created_at"]
        read_only_fields = ["status"]

    def validate(self, attrs):
        errors = ServiceRequest.booking_errors(
            service=attrs["service"], desired_at=attrs["desired_at"], phone=attrs["phone"]
        )
        if "service" in errors:
            errors["service_id"] = errors.pop("service")
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
