from django.contrib import admin

from .models import Category, Service, ServiceRequest


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}
    search_fields = ["name", "slug"]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price", "duration_minutes", "is_available"]
    list_filter = ["is_available", "category"]
    list_select_related = ["category"]
    search_fields = ["name", "description"]


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "service", "client_name", "desired_at", "status"]
    list_filter = ["status", "desired_at"]
    list_select_related = ["service"]
    search_fields = ["client_name", "phone", "service__name"]
    readonly_fields = ["created_at"]
