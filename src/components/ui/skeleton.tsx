"use client";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton h-4", className)} />;
}

/** Типовой скелетон страницы: заголовок + карточки. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-label={t("common.loadingAria")} className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}
