# Архитектура «Меридиана»

## Схема
```mermaid
flowchart LR
  subgraph Клиент
    B[Браузер / PWA<br/>360 px … 1440 px]
  end
  subgraph Amvera["Amvera (РФ)"]
    P[proxy.ts<br/>CSP nonce, заголовки,<br/>оптимистичный редирект]
    N[Next.js 16 App Router<br/>Server Components<br/>Server Actions]
    G[guards<br/>requireStudent / requireStaff]
    D[DAL<br/>src/server/dal<br/>фильтр по владельцу]
    A[ИИ-помощник<br/>src/server/ai]
    PG[(PostgreSQL 16<br/>managed)]
  end
  GC[GigaChat API<br/>Сбер]
  B -- HTTPS --> P --> N --> G --> D --> PG
  N --> A --> D
  A -- ключ из env --> GC
```

## Слои
| Слой | Где | Ответственность |
|---|---|---|
| Маршруты и UI | `src/app/(auth)`, `(student)`, `(staff)/staff`, `verify`, `api` | Страницы (Server Components по умолчанию), Server Actions, route handlers |
| Компоненты | `src/components` | UI-кит (`ui/`), оболочка (`shell/`), разделы |
| Авторизация | `src/server/auth` | Пароли, сессии, лимиты, guards |
| Данные | `src/server/dal` | Единственное место запросов к данным пользователя |
| Домен | `src/lib/brs.ts`, `src/lib/time.ts`, `src/server/documents.ts` | БРС-калькулятор, московское время, тексты справок |
| ИИ | `src/server/ai` | Положение (RAG по TF-IDF), контекст студента, GigaChat, офлайн-режим |
| БД | `src/server/db/schema.ts`, `drizzle/` | Схема, миграции |
| Сид | `src/server/seed` | Вымышленные данные «относительно сегодня» |

## Модель данных (основное)
```mermaid
erDiagram
  users ||--o| students : "1:1"
  users ||--o| staff : "1:1"
  users ||--o{ sessions : ""
  users ||--o{ notifications : ""
  faculties ||--o{ groups : ""
  programs ||--o{ groups : ""
  groups ||--o{ students : ""
  groups ||--o{ course_offerings : ""
  disciplines ||--o{ course_offerings : ""
  course_offerings ||--o{ assessments : ""
  assessments ||--o{ scores : ""
  students ||--o{ scores : ""
  groups ||--o{ lessons : ""
  students ||--o{ requests : ""
  request_types ||--o{ requests : ""
  requests ||--o{ request_events : "история"
  requests ||--o| documents : "справка с QR"
  staff ||--o{ slots : ""
  slots ||--o{ appointments : ""
  students ||--o{ appointments : ""
```
25 таблиц; индексы на всех внешних ключах и полях фильтрации (`requests(student_id, created_at)`, `requests(status, created_at)`, `lessons(group_id, starts_at)`, частичный индекс непрочитанных уведомлений и др.).

## Ключевые решения
- **Stateless-сервер.** Сессии и счётчики лимитов — в PostgreSQL, поэтому приложение можно запустить в N экземплярах за балансировщиком.
- **Динамический рендер персональных страниц** (`cacheComponents` выключен, D-013): исключён риск закешировать данные одного студента и показать другому.
- **Веерная рассылка уведомлений** одним `INSERT … SELECT` (объявления, переносы) — тысячи адресатов за один запрос.
- **Курсорная пагинация** ленты уведомлений; очередь деканата — постранично с сортировкой по сроку.
- **Время — всегда Москва** (`src/lib/time.ts`), сервер может жить в UTC.
- **Уведомления «созревают»:** у напоминаний время появления может быть в будущем; лента показывает `created_at ≤ сейчас`. Демо выглядит живым все три недели проверки без пересоздания данных.
- **Миграции и первичный сид — при старте контейнера** (`src/instrumentation.ts` → `src/server/startup.ts`).

## Масштабирование (если бы это был реальный сервис)
| Нагрузка | Решение |
|---|---|
| 10 000 студентов, пики в сессию | 2–4 реплики приложения, пул соединений pgBouncer, read-replica для чтения расписания |
| Рассылки на весь вуз | Очередь (например, отдельный воркер) вместо синхронного INSERT … SELECT |
| Интеграции с вузом | Расписание и оценки — импорт из учебной системы по API; вход — через единую учётную запись вуза (SSO) |
| Push на телефон | Web Push (VAPID) поверх существующих уведомлений |

## Запуск
См. `README.md` и `AGENTS.md` (раздел «Команды»). Production: `Dockerfile` (multi-stage, `output: standalone`), `amvera.yml`.
