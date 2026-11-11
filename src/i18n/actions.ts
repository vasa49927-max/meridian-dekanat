"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isLocale } from "./config";

/** Смена языка интерфейса: cookie на год, перерисовка всех страниц. */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 365 * 86400, sameSite: "lax", httpOnly: false, secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
}
