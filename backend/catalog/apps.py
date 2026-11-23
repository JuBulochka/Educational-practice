from django.apps import AppConfig
from django.db.backends.signals import connection_created


def register_casefold(sender, connection, **kwargs):
    if connection.vendor == "sqlite":
        connection.connection.create_function("catalog_casefold", 1, str.casefold, deterministic=True)


class CatalogConfig(AppConfig):
    name = "catalog"

    def ready(self):
        connection_created.connect(register_casefold, dispatch_uid="catalog.sqlite_casefold")
