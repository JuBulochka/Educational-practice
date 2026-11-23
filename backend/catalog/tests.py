from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Category, Service, ServiceRequest


class CatalogAPItests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.languages = Category.objects.create(name="Языки", slug="languages")
        cls.it = Category.objects.create(name="ИТ", slug="it")
        for index in range(8):
            Service.objects.create(
                category=cls.languages if index % 2 == 0 else cls.it,
                name=f"Урок {index}",
                description="Консультация по Excel" if index == 1 else "Учебное занятие",
                price=100 * (8 - index),
                duration_minutes=45,
            )
        cls.service = Service.objects.first()
        cls.hidden = Service.objects.create(
            category=cls.languages, name="Архивный курс", description="Архив",
            price=850, duration_minutes=90, is_available=False,
        )
        cls.staff = get_user_model().objects.create_user(
            username="test-manager", password="test-password-42", is_staff=True
        )

    def setUp(self):
        self.services_url = reverse("service-list")
        self.requests_url = reverse("servicerequest-list")
        self.payload = {
            "service_id": self.service.pk,
            "client_name": "Тестовый клиент",
            "phone": "+70000000000",
            "desired_at": (timezone.now() + timedelta(days=2)).isoformat(),
        }

    def test_catalog_public_list_excludes_unavailable(self):
        response = self.client.get(self.services_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 8)
        self.assertNotIn(self.hidden.pk, [row["id"] for row in response.data["results"]])

    def test_pagination(self):
        first = self.client.get(self.services_url)
        second = self.client.get(self.services_url, {"page": 2})
        self.assertEqual(len(first.data["results"]), 6)
        self.assertIsNotNone(first.data["next"])
        self.assertEqual(len(second.data["results"]), 2)
        self.assertIsNone(second.data["next"])
        self.assertTrue(
            {row["id"] for row in first.data["results"]}.isdisjoint(
                row["id"] for row in second.data["results"]
            )
        )

    def test_sorting(self):
        for ordering, descending in [("price", False), ("-price", True)]:
            with self.subTest(ordering=ordering):
                response = self.client.get(self.services_url, {"ordering": ordering})
                prices = [Decimal(row["price"]) for row in response.data["results"]]
                self.assertEqual(prices, sorted(prices, reverse=descending))

    def test_combined_filters(self):
        response = self.client.get(self.services_url, {
            "category": self.languages.pk, "is_available": "true",
            "min_price": 300, "max_price": 600, "ordering": "price",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([row["name"] for row in response.data["results"]], ["Урок 4", "Урок 2"])

    def test_search_in_name_and_description(self):
        for term in ["Excel", "Урок 1"]:
            with self.subTest(term=term):
                response = self.client.get(self.services_url, {"search": term})
                self.assertEqual([row["name"] for row in response.data["results"]], ["Урок 1"])

    def test_category_services_and_detail(self):
        response = self.client.get(reverse("category-services", args=[self.languages.pk]))
        self.assertEqual(response.data["count"], 4)
        self.assertTrue(all(row["category"] == self.languages.pk for row in response.data["results"]))
        detail = self.client.get(reverse("service-detail", args=[self.service.pk]))
        self.assertEqual(detail.data["category_name"], self.languages.name)

    def test_hidden_detail_not_public(self):
        response = self.client.get(reverse("service-detail", args=[self.hidden.pk]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_valid_application_gets_server_status(self):
        response = self.client.post(self.requests_url, dict(self.payload, status="completed"))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "new")
        self.assertEqual(ServiceRequest.objects.get(pk=response.data["id"]).service, self.service)

    def test_date_in_past(self):
        response = self.client.post(self.requests_url, dict(
            self.payload, desired_at=(timezone.now() - timedelta(days=1)).isoformat()
        ))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("desired_at", response.data)

    def test_unavailable_service(self):
        response = self.client.post(self.requests_url, dict(self.payload, service_id=self.hidden.pk))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_id", response.data)

    def test_missing_service(self):
        response = self.client.post(self.requests_url, dict(self.payload, service_id=99999))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_id", response.data)

    def test_blank_phone(self):
        response = self.client.post(self.requests_url, dict(self.payload, phone="  "))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

    def test_anonymous_price_update_denied(self):
        response = self.client.patch(reverse("service-detail", args=[self.service.pk]), {"price": 10})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.service.refresh_from_db()
        self.assertEqual(self.service.price, Decimal("800"))

    def test_requests_are_private(self):
        self.assertEqual(self.client.get(self.requests_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_query_parameters(self):
        for query, field in [
            ({"min_price": "abc"}, "min_price"), ({"max_price": "-1"}, "max_price"),
            ({"min_price": 100, "max_price": 10}, "max_price"),
            ({"is_available": "maybe"}, "is_available"),
            ({"category": "missing"}, "category"), ({"ordering": "name"}, "ordering"),
            ({"page": "x"}, "page"), ({"unknown": "arg"}, "unknown"),
        ]:
            with self.subTest(query=query):
                response = self.client.get(self.services_url, query)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_staff_service_crud_and_validation(self):
        self.client.force_authenticate(self.staff)
        data = {
            "name": "Новый урок", "description": "Описание урока",
            "category": self.it.pk, "price": "10", "duration_minutes": 30, "is_available": True,
        }
        invalid = self.client.post(self.services_url, dict(data, price=-1, duration_minutes=0))
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(set(invalid.data), {"price", "duration_minutes"})
        created = self.client.post(self.services_url, data)
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        url = reverse("service-detail", args=[created.data["id"]])
        updated = self.client.patch(url, {"price": 15, "is_available": False})
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["price"], "15.00")
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_session_and_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        credentials = {"username": self.staff.username, "password": "test-password-42"}
        login_url = reverse("staff-login")
        session_url = reverse("staff-session")
        self.assertEqual(client.post(login_url, credentials).status_code, status.HTTP_403_FORBIDDEN)
        csrf = client.get(session_url).data["csrfToken"]
        response = client.post(login_url, credentials, HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(client.get(session_url).data["username"], self.staff.username)
        url = reverse("service-detail", args=[self.service.pk])
        self.assertEqual(client.patch(url, {"price": 12}).status_code, status.HTTP_403_FORBIDDEN)
        csrf = response.data["csrfToken"]
        self.assertEqual(client.patch(url, {"price": 12}, HTTP_X_CSRFTOKEN=csrf).status_code, status.HTTP_200_OK)
        self.assertEqual(
            client.post(reverse("staff-logout"), HTTP_X_CSRFTOKEN=csrf).status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertIsNone(client.get(session_url).data["username"])
