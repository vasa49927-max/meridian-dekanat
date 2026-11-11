/** Языки интерфейса (раунд 3, D-035). Русский — основной; остальные — для иностранных студентов. */
export const LOCALES = ["ru", "en", "zh", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "lang";
export const LOCALE_NAMES: Record<Locale, string> = { ru: "Русский", en: "English", zh: "中文", fr: "Français" };
/** Локаль для Intl (даты, числа). */
export const INTL_LOCALE: Record<Locale, string> = { ru: "ru-RU", en: "en-GB", zh: "zh-CN", fr: "fr-FR" };
export const isLocale = (x: unknown): x is Locale => typeof x === "string" && (LOCALES as readonly string[]).includes(x);
