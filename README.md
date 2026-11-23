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

## Интерфейс

Нужен Node.js 20.19+ или 22.12+ и pnpm. Оставьте Django запущенным и выполните в другом PowerShell из корня репозитория.

```powershell
cd frontend
Copy-Item .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

Откройте http://127.0.0.1:5173/. Через «Управление» войдите с логином и паролем из команды `createsuperuser`. На карточке услуги можно перейти к заявке, а звёздочка сохраняет услугу в избранном. Контакты из заявки хранятся в Django, их видит только сотрудник.

База по умолчанию содержит 4 категории, 15 услуг и 8 учебных заявок. Одна из услуг закрыта для записи и доступна сотруднику. Для проверки полного цикла CRUD создайте новую услугу, измените цену, категорию и доступность, затем удалите эту услугу. Услуги, на которые уже есть заявки, защищены от удаления.

Команда `pnpm build` собирает интерфейс. `pnpm preview` запускает сборку локально на http://127.0.0.1:4173/. При размещении с другим сервером настройте возврат `index.html` для маршрутов React и проксирование `/api` на Django.

## Материалы для проверки

- [Каталог на 1280 px](docs/screenshots/02-catalog-desktop.png) и [каталог на 390 px](docs/screenshots/06-catalog-mobile.png).
- [Карточка услуги](docs/screenshots/03-service-detail.png), [форма заявки](docs/screenshots/04-request-form.png) и [экран сотрудника](docs/screenshots/05-management.png).
- [Короткая запись полного CRUD](docs/crud-demo.webm).
- [Результаты проверок](docs/VERIFICATION.md).
