# Лицензии сторонних материалов

Все зависимости — с разрешающими лицензиями. Код проекта — MIT (`LICENSE`).
Проверка: `npx license-checker-rseidelsohn --production --summary` (07.11.2026): MIT 134, ISC 12, Apache-2.0 11, OFL-1.1 2, BSD-3-Clause 1, 0BSD 1, CC-BY-4.0 1, LGPL-3.0-or-later 2 (см. примечание).

## Прямые зависимости (runtime)
| Пакет | Версия | Лицензия | Для чего |
|---|---|---|---|
| next | 16.4.5 | MIT | фреймворк |
| react, react-dom | 19.3.0 | MIT | UI |
| drizzle-orm | 0.45.4 | Apache-2.0 | ORM |
| pg | 8.23.1 | MIT | драйвер PostgreSQL |
| zod | 4.6.7 | MIT | валидация |
| @node-rs/argon2 | 2.2.2 | MIT | хэширование паролей |
| qrcode | 1.5.4 | MIT | QR-коды справок |
| lucide-react | 1.70.0 | ISC | иконки |
| radix-ui | 1.8.1 | MIT | примитивы доступных компонентов |
| cmdk | 1.1.1 | MIT | командная палитра |
| sonner | 2.0.8 | MIT | уведомления-тосты |
| class-variance-authority | 0.7.1 | Apache-2.0 | варианты компонентов |
| clsx, tailwind-merge | 2.1.1, 3.7.0 | MIT | классы |
| server-only | 0.0.1 | MIT | защита серверных модулей |
| @fontsource/golos-text | 5.3.0 | **OFL-1.1** | шрифт Golos Text (Paratype) |
| @fontsource/pt-serif | 5.3.0 | **OFL-1.1** | шрифт PT Serif (Paratype) |

## Инструменты разработки
tailwindcss 4 (MIT), typescript (Apache-2.0), eslint (MIT), drizzle-kit (MIT), vitest (MIT), @playwright/test (Apache-2.0), tsx (MIT), dotenv (BSD-2-Clause), lighthouse (Apache-2.0, запускался отдельно), axe-core (MPL-2.0, только в UX-ревью, в проект не входит).

## Примечания
- **@img/sharp-libvips (LGPL-3.0-or-later)** — необязательная зависимость Next.js для оптимизации изображений; подключается динамически, исходники не меняются. В проекте `next/image` не используется.
- **caniuse-lite (CC-BY-4.0)** — данные о поддержке браузеров для сборщика; атрибуция сохранена в пакете.

## Графика и контент
| Материал | Источник | Лицензия |
|---|---|---|
| Логотип «Меридиан», аватары, иконки PWA | созданы в проекте (SVG, Claude) | MIT вместе с кодом |
| Иконки интерфейса | Lucide | ISC |
| Тексты, вымышленное «Положение», все ФИО и данные | сгенерированы для проекта | MIT; любые совпадения с реальными людьми случайны |
| Факультеты, направления, адреса МГИМО | открытые данные (правила приёма, сайт кампуса) — см. `docs/research/RESEARCH.md` | факты, не объект авторского права |

Официальный логотип МГИМО не используется.
