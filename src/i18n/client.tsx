"use client";
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { Dict } from "./dict/ru";
import type { DataDict } from "./data";
import { buildI18n, type I18n } from ".";

const Ctx = createContext<I18n | null>(null);

/** Провайдер переводов для клиентских компонентов. Словарь приходит с сервера (только активный язык). */
export function I18nProvider({ locale, dict, data, children }: { locale: Locale; dict: Dict; data: DataDict | null; children: React.ReactNode }) {
  const value = useMemo(() => buildI18n(locale, dict, dict, data), [locale, dict, data]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n вне I18nProvider");
  return v;
}
