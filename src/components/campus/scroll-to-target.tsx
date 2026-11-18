"use client";
import { useEffect, useRef } from "react";

/** На телефоне схема шире экрана и листается вбок — сразу прокручиваем к цели маршрута (раунд 9, аудит UX). */
export function ScrollToTarget({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current; const dot = box?.querySelector("[data-target]");
    if (!box || !dot || box.scrollWidth <= box.clientWidth) return;
    const b = box.getBoundingClientRect(), d = dot.getBoundingClientRect();
    box.scrollLeft += d.left + d.width / 2 - (b.left + b.width / 2);
  }, []);
  return <div ref={ref} className={className} tabIndex={0} role="region" aria-label={label}>{children}</div>;
}
