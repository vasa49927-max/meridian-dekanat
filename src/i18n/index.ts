import type { Locale } from "./config";
import { makeT, makeTr, translit } from "./core";
import type { Dict } from "./dict/ru";
import type { DataDict } from "./data";
import { makeContentTr, type CONTENT } from "./content";
import { fmtFor } from "@/lib/time";

/** Набор функций перевода для языка (одинаковый на сервере и в браузере). */
export function buildI18n(locale: Locale, dict: Dict, fallback: Dict, data: DataDict | null, content: (typeof CONTENT)["en"] | null = null) {
  const { t, tn } = makeT(dict, fallback, locale);
  const tr = data ? makeTr(data) : (_g: string, v: string | null | undefined) => v ?? "";
  /** Имена людей: в нерусских интерфейсах — латиницей. */
  const name = (s: string | null | undefined) => (s == null ? "" : locale === "ru" ? s : translit(s));
  /** Содержимое из БД (объявления, сроки, комментарии, системные уведомления) — см. content.ts. */
  const tc = makeContentTr(locale, content, { tr, status: (st) => t(`common.status.${st}`) });
  return { locale, t, tn, tr, tc, name, f: fmtFor(locale) };
}
export type I18n = ReturnType<typeof buildI18n>;
