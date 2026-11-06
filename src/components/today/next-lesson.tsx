"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { untilText, fmt, relativeDay } from "@/lib/time";

type Props = {
  title: string; type: string; startsAt: string; endsAt: string; room: string; building: string; address: string; hint: string | null;
  teacher: string | null; teacherInitials: string; serverNow: string; moved: boolean; prevText: string | null;
};

/** Карточка следующей пары с живым обратным отсчётом (время синхронизировано с сервером). */
export function NextLessonCard(p: Props) {
  const skew = new Date(p.serverNow).getTime() - Date.now();
  const [nowMs, setNow] = useState(() => new Date(p.serverNow).getTime());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + skew), 15000);
    return () => clearInterval(id);
  }, [skew]);
  const start = new Date(p.startsAt).getTime();
  const end = new Date(p.endsAt).getTime();
  const ongoing = nowMs >= start && nowMs < end;
  const rel = relativeDay(new Date(start), new Date(nowMs));
  const soon = start - nowMs < 12 * 3600 * 1000;
  const label = ongoing ? "Идёт сейчас" : "Следующая пара";
  const countdown = ongoing ? <>ещё <b className="text-lg">{untilText(end - nowMs)}</b></> : soon ? <>через <b className="text-lg">{untilText(start - nowMs)}</b></> : <b className="text-base">{rel}, {fmt.time(new Date(start))}</b>;
  const progress = ongoing ? Math.min(100, ((nowMs - start) / (end - start)) * 100) : null;
  return (
    <section aria-label={label} className="relative overflow-hidden rounded-[var(--radius-card)] bg-hero p-5 text-hero-fg lg:p-6">
      <svg className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-[0.07]" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth=".6" /><path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17M5 26h30M5 14h30" fill="none" stroke="currentColor" strokeWidth=".6" />
      </svg>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-[#14182a]">{label}</span>
        <span className="text-sm" aria-live="polite">{countdown}</span>
      </div>
      <h2 className="font-serif text-[22px] leading-tight lg:text-[28px]">{p.title}</h2>
      <p className="mt-1.5 font-medium">{fmt.time(new Date(start))}–{fmt.time(new Date(end))} · {p.type} · ауд. {p.room}, {p.building}</p>
      {p.moved && p.prevText && <p className="mt-1 text-sm text-accent">Перенесена: было {p.prevText}</p>}
      <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-hero-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>{p.address}{p.hint && <span className="hidden sm:inline"> · {p.hint}</span>}</span></p>
      {p.teacher && <p className="mt-3 flex items-center gap-2 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-hero-2 text-[11px] font-bold" aria-hidden>{p.teacherInitials}</span>{p.teacher}</p>}
      {progress !== null && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-hero-2" role="progressbar" aria-label="Прошло времени пары" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} /></div>}
    </section>
  );
}
