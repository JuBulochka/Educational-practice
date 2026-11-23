from datetime import timedelta

from django.contrib.auth import authenticate, login, logout
from django.db.models import Count
from django.db.models.deletion import ProtectedError
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import SAFE_METHODS, AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .filters import ServiceFilter, ServiceSearchFilter
from .models import Category, Service, ServiceRequest
from .serializers import CategorySerializer, ServiceRequestSerializer, ServiceSerializer


def is_staff(request):
    return request.user.is_authenticated and request.user.is_staff


def visible_services(request):
    services = Service.objects.select_related("category")
    return services if is_staff(request) else services.filter(is_available=True)


class PublicCatalogViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        permission = AllowAny if self.request.method in SAFE_METHODS else IsAdminUser
        return [permission()]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Запись связана с другими данными. Удаление невозможно."},
                status=status.HTTP_409_CONFLICT,
            )


class CategoryViewSet(PublicCatalogViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    @action(detail=True, url_path="services")
    def services(self, request, pk=None):
        category = self.get_object()
        services = visible_services(request).filter(category=category)
        page = self.paginate_queryset(services)
        serializer = ServiceSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class ServiceViewSet(PublicCatalogViewSet):
    serializer_class = ServiceSerializer
    filterset_class = ServiceFilter
    filter_backends = [DjangoFilterBackend, ServiceSearchFilter, filters.OrderingFilter]
    search_fields = ["search_name", "search_description"]
    ordering_fields = ["price"]
    ordering = ["id"]

    def get_queryset(self):
        return visible_services(self.request)

    def list(self, request, *args, **kwargs):
        query = request.query_params
        allowed = {"category", "is_available", "min_price", "max_price", "search", "ordering", "page", "format"}
        errors = {
            key: "Неизвестный параметр." for key in sorted(query.keys() - allowed)
        }
        for key in allowed & query.keys():
            if len(query.getlist(key)) > 1:
                errors[key] = "Укажите только одно значение."
        if query.get("is_available", "true") not in {"true", "false"}:
            errors["is_available"] = "Допустимые значения: true или false."
        if query.get("ordering", "price") not in {"price", "-price"}:
            errors["ordering"] = "Укажите price или -price."
        if "page" in query and (
            not query["page"].isascii() or not query["page"].isdigit()
            or query["page"].startswith("0") or len(query["page"]) > 9
        ):
            errors["page"] = "Укажите положительный номер страницы."
        if errors:
            raise ValidationError(errors)
        return super().list(request, *args, **kwargs)

    def filter_queryset(self, queryset):
        if self.action != "list":
            return queryset
        filtered = super().filter_queryset(queryset)
        return filtered.order_by(self.request.query_params.get("ordering", "id"), "id")


class ServiceRequestViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    queryset = ServiceRequest.objects.select_related("service")
    serializer_class = ServiceRequestSerializer

    def get_permissions(self):
        return [AllowAny() if self.action == "create" else IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(status=ServiceRequest.Status.NEW)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def statistics(request):
    today = timezone.localdate()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=7)
    categories = Category.objects.annotate(service_count=Count("services")).values(
        "id", "name", "service_count"
    )
    new_requests = ServiceRequest.objects.filter(
        status=ServiceRequest.Status.NEW,
        created_at__date__gte=week_start,
        created_at__date__lt=week_end,
    ).count()
    return Response({
        "categories": list(categories),
        "new_requests_this_week": new_requests,
        "week_start": week_start,
    })


@method_decorator(csrf_protect, name="dispatch")
class StaffLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "staff_login"

    def post(self, request):
        username, password = request.data.get("username"), request.data.get("password")
        if not isinstance(username, str) or not isinstance(password, str) or not username.strip() or not password:
            return Response({"detail": "Введите логин и пароль."}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=username.strip(), password=password)
        if user is None or not user.is_staff:
            return Response({"detail": "Вход не выполнен. Проверьте данные сотрудника."}, status=status.HTTP_403_FORBIDDEN)
        login(request, user)
        return Response({"username": user.get_username(), "csrfToken": get_token(request)})


@api_view(["GET"])
@permission_classes([AllowAny])
def staff_session(request):
    return Response({
        "username": request.user.get_username() if is_staff(request) else None,
        "csrfToken": get_token(request),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def staff_logout(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)
