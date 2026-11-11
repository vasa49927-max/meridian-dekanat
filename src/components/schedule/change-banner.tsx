import Link from "next/link";
import { ArrowLeftRight, Ban, DoorOpen } from "lucide-react";
import type { LessonView } from "@/server/dal/student";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";

export type ChangeKind = "cancel" | "move" | "room";

/** Тип изменения: отмена, перенос по времени или только смена аудитории. */
export function changeKind(l: Pick<LessonView, "status" | "startsAt" | "prevStartsAt">): ChangeKind | null {
  if (l.status === "CANCELLED") return "cancel";
  if (l.status !== "MOVED") return null;
  return l.prevStartsAt && +l.prevStartsAt !== +l.startsAt ? "move" : "room";
}

/** label — русская подпись (для совместимости); в интерфейсе подпись берётся из словаря schedule.change.kind. */
export const CHANGE_META: Record<ChangeKind, { label: string; icon: typeof Ban; chip: string }> = {
  cancel: { label: "Отмена", icon: Ban, chip: "bg-danger-bg text-danger ring-1 ring-danger-line" },
  move: { label: "Перенос", icon: ArrowLeftRight, chip: "bg-warn-bg text-warn ring-1 ring-warn-line" },
  room: { label: "Другая аудитория", icon: DoorOpen, chip: "bg-info-bg text-info" },
};

/** Серверные компоненты: язык берут сами через getI18n(), вызывающим ничего передавать не нужно. */
export async function ChangeChip({ kind, className }: { kind: ChangeKind; className?: string }) {
  const { t } = await getI18n();
  const m = CHANGE_META[kind];
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-bold uppercase tracking-wide", m.chip, className)}><m.icon className="h-3.5 w-3.5" aria-hidden />{t(`schedule.change.kind.${kind}`)}</span>;
}

/** Одна строка «что теперь» — крупно, и «вместо чего» — мелко. Без зачёркиваний (правка капитана №2c). */
export async function ChangeLines({ l }: { l: LessonView }) {
  const { t, f, tc } = await getI18n();
  const kind = changeKind(l);
  const prev = l.prevStartsAt ?? l.startsAt;
  if (kind === "cancel") return (
    <>
      <span className="block font-semibold text-fg">{f.shortDay(l.startsAt)} · {f.time(l.startsAt)} — <span className="text-danger">{t("schedule.change.noClass")}</span></span>
      {l.changeNote && <span className="block text-[13px] text-muted">{tc(l.changeNote)}</span>}
    </>
  );
  if (kind === "room") return (
    <>
      <span className="block font-semibold text-fg">{t("schedule.change.roomNow", { day: f.shortDay(l.startsAt), time: f.time(l.startsAt), room: l.room })}</span>
      <span className="block text-[13px] text-muted">{t("schedule.change.roomWas", { room: l.prevRoom ?? "" })}{l.changeNote ? ` · ${tc(l.changeNote)}` : ""}</span>
    </>
  );
  return (
    <>
      <span className="block font-semibold text-fg">{t("schedule.change.movedNow", { day: f.shortDay(l.startsAt), time: f.time(l.startsAt), room: l.room })}</span>
      <span className="block text-[13px] text-muted">{t("schedule.change.movedWas", { day: f.shortDay(prev), time: f.time(prev), room: l.prevRoom ?? "" })}{l.changeNote ? ` — ${tc(l.changeNote)}` : ""}</span>
    </>
  );
}

/** Блок изменений на главном экране: тип изменения цветным ярлыком, новое время — крупно. */
export async function ChangeBanner({ changes }: { changes: LessonView[] }) {
  if (!changes.length) return null;
  const { t, tr } = await getI18n();
  return (
    <section aria-label={t("schedule.change.bannerAria")} className="rounded-[var(--radius-card)] border border-warn-line border-l-4 border-l-warn bg-surface p-4 shadow-[var(--shadow-card)] lg:p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold"><ArrowLeftRight className="h-5 w-5 text-warn" aria-hidden />{t("schedule.change.bannerTitle", { n: changes.length })}</h2>
      <ul className="divide-y divide-line">
        {changes.slice(0, 4).map((c) => {
          const key = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(c.startsAt);
          const kind = changeKind(c)!;
          return (
            <li key={c.id}>
              <Link href={`/schedule?d=${key}`} className="grid gap-1 rounded-lg py-3 hover:bg-surface-2/60 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-3">
                <span><ChangeChip kind={kind} /></span>
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold text-fg">{tr("subjects", c.title)}</span>
                  <ChangeLines l={c} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
