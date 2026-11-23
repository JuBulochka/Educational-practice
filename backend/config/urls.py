from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from catalog import views


router = DefaultRouter()
router.register("categories", views.CategoryViewSet)
router.register("services", views.ServiceViewSet, basename="service")
router.register("requests", views.ServiceRequestViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/session/", views.staff_session),
    path("api/auth/login/", views.StaffLoginView.as_view()),
    path("api/auth/logout/", views.staff_logout),
    path("api/statistics/", views.statistics),
    path("api/", include(router.urls)),
]
