"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, MapPin, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/client";

type Props = {
  mapHref?: string; title: string; type: string; startsAt: string; endsAt: string; room: string; building: string; address: string; hint: string | null;
  teacher: string | null; teacherFull?: string | null; teacherPosition?: string | null; teacherInitials: string; serverNow: string; moved: boolean; prevText: string | null;
};

/**
 * Карточка следующей пары. Правка капитана №2b: главное, что студент видит за секунду, —
 * ПРЕДМЕТ, ДЕНЬ, ВРЕМЯ НАЧАЛА и АУДИТОРИЯ (крупные плитки). Всё остальное — мелко, ниже.
 * Отсчёт живой и синхронизирован с временем сервера.
 */
export function NextLessonCard(p: Props) {
  const { t, tn, f } = useI18n();
  /** «25 мин», «2 ч 10 мин», «3 дня» — на языке интерфейса (как untilText из lib/time). */
  const until = (ms: number) => {
    const total = Math.max(0, Math.round(ms / 60000));
    if (total < 60) return t("today.dur.min", { n: total });
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h >= 24) return tn("today.dur.days", Math.floor(h / 24));
    return m ? t("today.dur.hm", { h, m }) : t("today.dur.h", { n: h });
  };
  const [nowMs, setNow] = useState(() => new Date(p.serverNow).getTime());
  useEffect(() => {
    const skew = new Date(p.serverNow).getTime() - Date.now(); // разница часов клиента и сервера
    const id = setInterval(() => setNow(Date.now() + skew), 15000);
    return () => clearInterval(id);
  }, [p.serverNow]);
  const start = new Date(p.startsAt);
  const end = new Date(p.endsAt);
  const ongoing = nowMs >= +start && nowMs < +end;
  const near = f.near(start, new Date(nowMs));
  const soon = +start - nowMs < 12 * 3600 * 1000;
  const label = ongoing ? t("today.next.now") : t("today.next.next");
  const countdown = ongoing ? t("today.next.left", { time: until(+end - nowMs) }) : soon ? t("today.next.in", { time: until(+start - nowMs) }) : null;
  const progress = ongoing ? Math.min(100, ((nowMs - +start) / (+end - +start)) * 100) : null;
  // Правка капитана (раунд 2): в плитке «День» — дата числом (не переносится), день недели — подписью ниже.
  const weekday = f.weekday(start);
  const dayLine = near ? t("today.next.nearWeekday", { near, weekday }) : weekday;
  const tiles: [string, string, string][] = [
    [t("today.next.day"), f.dayMonth(start), dayLine],
    [t("today.next.start"), f.time(start), t("today.next.until", { time: f.time(end) })],
    [t("today.next.room"), p.room, p.building],
  ];
  return (
    <section aria-label={t("today.next.aria", { label, title: p.title, weekday: dayLine, date: f.dayMonth(start), time: f.time(start), room: p.room })} className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-hero p-4 text-hero-fg sm:p-5 lg:p-6">
      <svg className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-[0.07]" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth=".6" /><path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17M5 26h30M5 14h30" fill="none" stroke="currentColor" strokeWidth=".6" />
      </svg>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-[#14182a]">{label}</span>
        {countdown && <span className="rounded-full bg-hero-2 px-3 py-1 text-sm font-semibold" aria-live="polite">{countdown}</span>}
      </div>
      <h2 className="font-serif text-[26px] leading-[1.15] lg:text-[32px]">{p.title}</h2>

      {/* Плитка «День» шире остальных: дата «28 сентября» должна влезать без переноса посреди слова */}
      <dl className="mt-4 grid grid-cols-[1.4fr_1fr_1fr] gap-1.5 sm:grid-cols-3 sm:gap-3 lg:mt-auto lg:pt-5">
        {tiles.map(([k, val, sub]) => (
          <div key={k} className="min-w-0 rounded-xl bg-hero-2/70 px-2.5 py-2.5 sm:px-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-hero-muted sm:text-[11px]">{k}</dt>
            <dd className="mt-0.5 text-[17px] font-bold leading-tight tabular min-[420px]:text-xl sm:whitespace-nowrap sm:text-[26px]">{val}</dd>
            <dd className="mt-0.5 text-xs leading-snug text-hero-muted sm:text-[13px]">{sub}</dd>
          </div>
        ))}
        {/* Правка капитана (раунд 4): плашка с должностью и ФИО преподавателя — на всю ширину под тремя плитками */}
        {p.teacherFull && (
          <div className="col-span-3 flex min-w-0 items-center gap-3 rounded-xl bg-hero-2/70 px-2.5 py-2.5 sm:px-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-hero/60 text-accent" aria-hidden><UserRound className="h-5 w-5" /></span>
            <div className="min-w-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-hero-muted sm:text-[11px]">{t("today.next.teacher")}</dt>
              <dd className="text-[15px] font-bold leading-tight sm:text-lg">{p.teacherFull}</dd>
              {p.teacherPosition && <dd className="text-xs text-hero-muted sm:text-[13px]">{p.teacherPosition}</dd>}
            </div>
          </div>
        )}
      </dl>

      {p.moved && p.prevText && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-[#14182a]"><ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />{t("today.next.moved")}</span>
          <span className="text-hero-muted">{t("today.next.usually", { text: p.prevText })}</span>
        </p>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[13px] text-hero-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{p.type}{p.teacher && !p.teacherFull ? ` · ${p.teacher}` : ""} · {p.address}{p.hint && <span className="hidden sm:inline"> · {p.hint}</span>}
          {p.mapHref && <> · <Link href={p.mapHref} className="font-semibold text-hero-fg underline underline-offset-2">{t("campus.link")}</Link></>}</span>
      </p>
      {progress !== null && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hero-2" role="progressbar" aria-label={t("today.next.progress")} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} /></div>}
    </section>
  );
}
