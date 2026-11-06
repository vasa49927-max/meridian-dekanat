# AGENTS.md — правила для ИИ-агентов в этом репозитории

Этот файл читают все ИИ-ассистенты (Claude Code, Cursor, Copilot, GigaCode, OpenCode и др.) перед любой правкой.
Если правило мешает задаче — не обходи его молча: предложи изменение и зафиксируй его в `docs/DECISIONS.md`.

## 1. Что это за проект
«Меридиан»* — концепт личного кабинета студента МГИМО («Цифровой деканат будущего») для конкурса МГИМО по ИИ.
**Не официальный сервис МГИМО.** Все данные вымышлены. Продуктовая логика — `docs/PRD.md`, архитектура — `docs/ARCHITECTURE.md`.
\* рабочее название, окончательное — в `docs/DECISIONS.md`.

Две роли: `STUDENT` (свой кабинет) и `STAFF` (сотрудник деканата: очередь заявок, объявления, переносы пар).
Сквозной сценарий, который всегда должен работать: студент подал заявку → деканат сменил статус → студент увидел статус и уведомление.

## 2. Стек (не менять без записи в DECISIONS.md)
- Next.js (App Router, Server Components, Server Actions) + TypeScript `strict`
- Tailwind CSS v4 + компоненты в стиле shadcn/ui (лежат в `src/components/ui`, правим как свой код) + lucide-react
- Prisma ORM + PostgreSQL 16; валидация — zod
- Пароли — argon2id (`@node-rs/argon2`); сессии — собственные, в таблице `Session`
- Тесты — Vitest (unit) + Playwright (e2e)
- Шрифты — `@fontsource/*` (self-host). **Запрещены** в рантайме: внешние CDN, Google Fonts, внешние картинки, аналитика.

## 3. Структура
```
src/app/(auth)/login         вход
src/app/(student)/...        кабинет студента (today, schedule, grades, requests, notifications, profile, assistant, appointments)
src/app/(staff)/staff/...    кабинет деканата
src/app/api/...              route handlers (ics, assistant, health)
src/app/verify/[code]        публичная проверка подлинности справки по QR
src/server/auth/             сессии, пароли, rate limit, guards (requireStudent/requireStaff)
src/server/dal/              Data Access Layer — ЕДИНСТВЕННОЕ место, где код ходит в БД за данными пользователя
src/server/ai/               ИИ-помощник (GigaChat), промпты, инструменты
src/lib/                     чистые утилиты без доступа к БД (форматирование дат, БРС-калькулятор)
src/components/              UI; ui/ — базовые компоненты
prisma/                      schema.prisma, migrations, seed.ts
tests/unit, tests/e2e        тесты
docs/                        вся документация (см. раздел 8)
```

## 4. Правила безопасности (нарушение = задача не выполнена)
1. **Владелец данных берётся только из сессии.** Любая функция DAL принимает `viewer` (результат `requireStudent()`/`requireStaff()`) и фильтрует по `viewer.userId`. Никогда не принимай `userId`/`studentId` из URL, формы или тела запроса как «чей это объект».
2. Объект по id из URL ищется как `where: { id, studentId: viewer.studentId }`. Не нашёлся → `notFound()` (404), а не 403: не подтверждаем существование чужого объекта.
3. Роль проверяется на сервере в каждом layout **и** в каждом Server Action / route handler (layout не защищает action).
4. Пароли — только argon2id-хэш. Сессионный токен в cookie — случайные 32 байта; в БД хранится только его SHA-256.
5. Cookie: `httpOnly`, `secure` (в production), `sameSite=lax`, `path=/`. Logout удаляет запись сессии.
6. Изменяющие запросы: Server Actions (Next проверяет Origin) + собственная проверка `Origin` в route handlers с методами POST/PUT/PATCH/DELETE.
7. Секреты только из `process.env` на сервере, через `src/server/env.ts` (zod). Никаких `NEXT_PUBLIC_` для секретов. Файл `.env` не коммитится.
8. Ошибки входа — одна формулировка «Неверный логин или пароль»; лимит попыток — в БД (работает при нескольких инстансах).
9. Никаких реальных персональных данных. ФИО, номера зачёток, оценки — только вымышленные.

## 5. Стиль кода
- TypeScript strict, без `any` (исключение — с комментарием почему).
- Серверный код по умолчанию; `"use client"` — только для интерактива.
- Мутации — Server Actions с zod-схемой на входе; возвращают `{ ok: true } | { ok: false, error }`.
- Списки с потенциальным ростом (уведомления, заявки, очередь) — пагинация курсором.
- Имена: компоненты `PascalCase`, файлы компонентов `kebab-case.tsx`, функции DAL — глаголом (`getMyGrades`, `listMyRequests`).
- Тексты интерфейса — по-русски, на «ты»/безлично — см. `docs/DESIGN.md` (раздел «Голос»).
- Дизайн-токены только из `src/app/globals.css` (CSS-переменные). Не хардкодь цвета в компонентах.

## 6. Команды
```bash
npm install
npm run db:up          # локальный PostgreSQL (docker compose) — или свой PG, см. .env.example
npm run db:migrate     # prisma migrate dev
npm run db:seed        # демо-данные (осень 2026)
npm run dev            # http://localhost:3000
npm run lint && npm run typecheck
npm run test           # vitest
npm run test:e2e       # playwright (поднимает dev-сервер сам)
npm run build && npm start
npm run check:bundle   # поиск секретов в клиентской сборке
```

## 7. Definition of Done
Задача готова, когда:
- [ ] работает на 360 px (без горизонтального скролла) и на 1440 px, в светлой и тёмной теме;
- [ ] есть состояния: загрузка (скелетон), пусто, ошибка;
- [ ] всё управляется с клавиатуры, видимый фокус, aria-метки у иконок-кнопок, контраст AA;
- [ ] `lint`, `typecheck`, `test` и затронутые e2e зелёные;
- [ ] если трогали данные пользователя — есть e2e/unit-тест, что чужой объект даёт 404;
- [ ] добавлена запись в `docs/PROCESS_LOG.md` (задача → промпт → результат → ошибки ИИ → исправления);
- [ ] архитектурное решение — в `docs/DECISIONS.md`; новая зависимость — в `docs/LICENSES.md`.

## 8. Документация
`docs/PRD.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DESIGN.md`, `DECISIONS.md`, `LICENSES.md`, `TEST_ACCOUNTS.md`, `COMPLIANCE.md`, `PROCESS_LOG.md`, `prompts/`, `screenshots/` (Playwright, `NN-этап-описание-360|1440.png`).
