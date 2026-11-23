# Схема данных

```mermaid
erDiagram
    CATEGORY ||--o{ SERVICE : содержит
    SERVICE ||--o{ SERVICE_REQUEST : принимает
    CATEGORY {
        int id PK
        string name
        string slug UK
    }
    SERVICE {
        int id PK
        int category_id FK
        string name
        text description
        decimal price
        int duration_minutes
        boolean is_available
        datetime created_at
    }
    SERVICE_REQUEST {
        int id PK
        int service_id FK
        string client_name
        string phone
        datetime desired_at
        string status
        datetime created_at
    }
```

Поля всех трёх таблиц обязательны и не допускают NULL. ID и дата создания задаются автоматически. У новой услуги доступность по умолчанию включена, у заявки статус по умолчанию `new`. Категория может содержать много услуг, а услуга может иметь много заявок. Удаление записей со связанными услугами или заявками защищено. База ограничивает цену значением от нуля, длительность от одной минуты и допустимые значения статуса.
