# Каталог услуг учебного центра

Учебная практика УП.05. Задания № 1 и № 2.

## Сервер

Нужен Python 3.11 или новее. Команды для PowerShell из корня репозитория.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
$catalogKey = .\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
(Get-Content .env) -replace '^DJANGO_SECRET_KEY=$', "DJANGO_SECRET_KEY=$catalogKey" | Set-Content .env
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_catalog
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Модели и связи описаны в [ER.md](ER.md). Панель Django доступна по адресу http://127.0.0.1:8000/admin/.

Маршруты и примеры запросов описаны в [API.md](API.md). Пример ответа со списком услуг виден на [скриншоте API](docs/screenshots/01-api-services.png).

В каталоге `backend` команда `.\.venv\Scripts\python.exe manage.py test catalog` запускает API-тесты. Тестовая БД создаётся автоматически.
