from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField("название", max_length=120)
    slug = models.SlugField(max_length=120, unique=True)

    class Meta:
        ordering = ["name", "id"]
        verbose_name = "категория"
        verbose_name_plural = "категории"

    def __str__(self):
        return self.name


class Service(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="services", verbose_name="категория"
    )
    name = models.CharField("название", max_length=160)
    description = models.TextField("описание", max_length=4000)
    price = models.DecimalField(
        "цена", max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    duration_minutes = models.PositiveIntegerField(
        "длительность в минутах", validators=[MinValueValidator(1)]
    )
    is_available = models.BooleanField("доступна", default=True)
    created_at = models.DateTimeField("дата создания", auto_now_add=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "услуга"
        verbose_name_plural = "услуги"
        constraints = [
            models.CheckConstraint(condition=models.Q(price__gte=0), name="service_price_nonnegative"),
            models.CheckConstraint(
                condition=models.Q(duration_minutes__gt=0), name="service_duration_positive"
            ),
        ]

    def __str__(self):
        return self.name


class ServiceRequest(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новая"
        CONFIRMED = "confirmed", "Подтверждена"
        COMPLETED = "completed", "Выполнена"
        CANCELLED = "cancelled", "Отменена"

    service = models.ForeignKey(
        Service, on_delete=models.PROTECT, related_name="requests", verbose_name="услуга"
    )
    client_name = models.CharField("имя клиента", max_length=120)
    phone = models.CharField("телефон", max_length=40)
    desired_at = models.DateTimeField("желаемая дата и время")
    status = models.CharField("статус", max_length=12, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField("дата создания", auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "заявка"
        verbose_name_plural = "заявки"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=["new", "confirmed", "completed", "cancelled"]),
                name="request_valid_status",
            )
        ]

    @classmethod
    def booking_errors(cls, *, service, desired_at, phone):
        errors = {}
        if service and not service.is_available:
            errors["service"] = "Эта услуга сейчас недоступна."
        if desired_at and desired_at <= timezone.now():
            errors["desired_at"] = "Укажите дату и время в будущем."
        if not (phone or "").strip():
            errors["phone"] = "Укажите телефон."
        return errors

    def clean(self):
        super().clean()
        if self._state.adding:
            errors = self.booking_errors(
                service=self.service if self.service_id else None,
                desired_at=self.desired_at,
                phone=self.phone,
            )
            if errors:
                raise ValidationError(errors)

    def __str__(self):
        return f"Заявка №{self.pk or '—'}"
