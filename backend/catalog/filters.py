from django import forms
from django.db.models import CharField, Func
from django_filters import rest_framework as filters
from rest_framework.filters import SearchFilter

from .models import Service


class Casefold(Func):
    function = "catalog_casefold"
    output_field = CharField()


class ServiceSearchFilter(SearchFilter):
    def get_search_terms(self, request):
        return [term.casefold() for term in super().get_search_terms(request)]

    def filter_queryset(self, request, queryset, view):
        if self.get_search_terms(request):
            queryset = queryset.alias(
                search_name=Casefold("name"),
                search_description=Casefold("description"),
            )
        return super().filter_queryset(request, queryset, view)


class ServiceFilterForm(forms.Form):
    def clean(self):
        data = super().clean()
        minimum = data.get("min_price")
        maximum = data.get("max_price")
        if minimum is not None and maximum is not None and minimum > maximum:
            self.add_error("max_price", "Максимальная цена должна быть не ниже минимальной.")
        return data


class ServiceFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte", min_value=0)
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte", min_value=0)

    class Meta:
        model = Service
        fields = ["category", "is_available", "min_price", "max_price"]
        form = ServiceFilterForm
