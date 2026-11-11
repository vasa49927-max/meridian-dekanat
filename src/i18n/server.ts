import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { DICTS } from "./dict";
import { DATA } from "./data";
import { buildI18n } from ".";

/** Язык интерфейса из cookie (по умолчанию русский). */
export const getLocale = cache(async (): Promise<Locale> => {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
});

/** Переводы для серверных компонентов: const { t, tn, tr, f } = await getI18n(); */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return buildI18n(locale, DICTS[locale], DICTS.ru, locale === "ru" ? null : DATA[locale]);
});

/** То, что нужно провайдеру в браузере: только активный язык. */
export async function clientI18nProps() {
  const locale = await getLocale();
  return { locale, dict: DICTS[locale], data: locale === "ru" ? null : DATA[locale] };
}
