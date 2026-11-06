"use client";
import { useEffect } from "react";

/** Регистрирует service worker (PWA: установка на телефон и офлайн-экран). */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);
  return null;
}
