from django import forms
from django_filters import rest_framework as filters

from .models import Service


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
