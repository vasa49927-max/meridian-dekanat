"use client";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

/**
 * Сгенерированный аватар: инициалы на градиенте с «меридианами». Без фотографий реальных людей.
 * Градиент — CSS-фоном, а не <linearGradient id>: при одинаковых id у двух аватаров (меню скрыто на телефоне)
 * браузер брал градиент из скрытой копии, и аватар в профиле был пустым (найдено при обзоре раунда 2).
 */
export function Avatar({ name, hue = 220, size = 40, className }: { name: string; hue?: number; size?: number; className?: string }) {
  const { t, name: nm } = useI18n();
  const shown = nm(name);
  const initials = shown.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span role="img" aria-label={t("common.avatar", { name: shown })} className={cn("inline-block shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${(hue + 40) % 360} 50% 22%))` }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <path d="M20 2c-6 4.5-9 10.5-9 18s3 13.5 9 18M20 2c6 4.5 9 10.5 9 18s-3 13.5-9 18" stroke="white" strokeOpacity=".14" fill="none" />
        <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#F8F4EA" fontFamily="Golos Text, sans-serif">{initials}</text>
      </svg>
    </span>
  );
}
