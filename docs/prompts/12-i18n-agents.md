# Промпты субагентов-переводчиков (этап 18)

Оркестратор сначала сделал каркас (`src/i18n`, словарь `common`, `data.ts`, `grades.plan`, оболочку кабинета) и правила (`docs/I18N.md`), затем запустил 4 агента параллельно. Каждый агент получил один и тот же шаблон с разной областью файлов.

## Общая часть (для всех четырёх)
> You are translating part of a Next.js 16 student-portal app into 4 UI languages. FIRST read docs/I18N.md and the reference files (src/i18n/*, dict/ru/common.ts, dict/en/common.ts, data.ts, fmtFor in src/lib/time.ts, top-bar.tsx, student layout).
> Edit ONLY the files in YOUR SCOPE and ONLY your dictionary namespaces (other agents work in parallel).
> 1. Replace every user-visible Russian string with t()/tn(); server: `await getI18n()`, client: `useI18n()`; metadata → generateMetadata.
> 2. The Russian text in dict/ru must be EXACTLY what was in the code (e2e tests assert on Russian).
> 3. DB data → tr("subjects"|"buildings"|"rt"|…); names → name(); human-written texts stay as-is.
> 4. Dates → localized `f`; language-neutral comparisons instead of «завтра» === …
> 5. Plurals → tn with ru {one,few,many,other}, en/fr {one,other}, zh {other}.
> 6. Natural university-portal English, Simplified Chinese, French.
> 7. Only typecheck + eslint on your files; no dev server, e2e, DB or git.
> Report: files changed, keys added, cross-file issues (do not fix outside scope).

## Области
| Агент | Файлы | Словари |
|---|---|---|
| A | «Сегодня», карточка пары, уведомления, «Ещё» | today, notifications |
| B | расписание, календарь, сессия, плашка изменений, запись к методисту | schedule, appointments |
| C | успеваемость, калькулятор, помощник (+ язык ответа GigaChat) | grades, assistant |
| D | заявки, вложения, оценка, профиль, вход, проверка справки, 404/офлайн/ошибка | requests, profile, auth |

## Что оркестратор сделал после
Собрал отчёты, закрыл найденные «стыки» (сроки контрольных точек из DAL на «Сегодня», подсказка поля справки в `data.ts`, ошибки API уведомлений), перезапустил полный набор тестов и проверил ширину всех страниц на трёх языках.
