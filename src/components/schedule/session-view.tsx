import Link from "next/link";
import { CheckCircle2, Flag, GraduationCap, MapPin, MessagesSquare } from "lucide-react";
import type { StudentViewer } from "@/server/auth/guards";
import { getMyGrades, listMyLessons } from "@/server/dal/student";
import { planFor } from "@/lib/brs";
import { addDays, msk, mskParts, startOfDay } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { teacherShortI18n } from "./lesson-meta";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";
import { planText } from "@/i18n/brs";

/**
 * Вкладка «Сессия» (раунд 3): зачёты и экзамены с консультациями одним списком.
 * У каждого — связь с «Успеваемостью»: если автомат уже есть, так и пишем «можно не сдавать».
 */
export async function SessionView({ v, at }: { v: StudentViewer; at: Date }) {
  const { t, tn, tr, name, f } = await getI18n();
  const p = mskParts(at);
  // Ближайшая сессия: зимняя (декабрь–январь) или летняя (июнь–июль).
  const from = p.m >= 8 || p.m === 1 ? msk(p.m === 1 ? p.y - 1 : p.y, 12, 1) : msk(p.y, 6, 1);
  const to = addDays(from, 62);
  const [lessons, grades] = await Promise.all([listMyLessons(v, from, to), getMyGrades(v)]);
  const items = lessons.filter((l) => l.type === "EXAM" || l.type === "CREDIT");
  const consults = lessons.filter((l) => l.type === "CONSULTATION");
  const byName = new Map(grades.current.map((d) => [d.name, d]));
  if (!items.length) return <EmptyState icon={<GraduationCap />} title={t("schedule.session.emptyTitle")}>{t("schedule.session.emptyText")}</EmptyState>;

  const first = items[0];
  const daysLeft = Math.max(0, Math.round((+startOfDay(first.startsAt) - +startOfDay(at)) / 86400000));
  const autos = items.filter((l) => byName.get(l.title)?.summary.auto?.achieved);
  const credits = items.filter((l) => l.type === "CREDIT");
  const exams = items.filter((l) => l.type === "EXAM");

  // Месяц под крупным числом: «ноября» / "November"; в китайском дата вида «11月21日» — показываем «11月».
  const month = (x: Date) => (f.locale === "zh" ? `${mskParts(x).m}月` : f.dayMonth(x).split(" ")[1]);

  const Item = ({ l }: { l: (typeof items)[number] }) => {
    const d = byName.get(l.title);
    const teacher = teacherShortI18n(l, tr, name);
    const plan = d ? planText(planFor(d.control, d.summary), d.summary, t) : null;
    const auto = d?.summary.auto?.achieved;
    const consult = consults.find((c) => c.title === l.title && c.startsAt < l.startsAt);
    return (
      <li className={cn("grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border bg-surface p-3.5 sm:grid-cols-[88px_minmax(0,1fr)]", auto ? "border-ok/40" : "border-line")}>
        <div className="self-start rounded-xl bg-surface-2 py-2 text-center">
          <p className="font-serif text-3xl font-bold leading-none tabular">{mskParts(l.startsAt).d}</p>
          <p className="text-xs text-muted">{month(l.startsAt)}</p>
          <p className="mt-0.5 text-xs font-semibold uppercase text-muted">{f.weekdayShort(l.startsAt)}</p>
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={l.type === "EXAM" ? "primary" : "neutral"}>{l.type === "EXAM" ? t("common.control.EXAM") : d?.control === "GRADED_CREDIT" ? t("common.control.GRADED_CREDIT") : t("common.control.CREDIT")}</Badge>
            {auto && <Badge tone="ok" className="whitespace-normal"><CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />{t("schedule.session.auto")}</Badge>}
          </div>
          <h3 className="font-semibold leading-snug">{tr("subjects", l.title)}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            <span className="font-semibold text-fg tabular">{f.time(l.startsAt)}–{f.time(l.endsAt)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{t("schedule.session.place", { room: l.room, building: tr("buildings", l.buildingName) })}</span>
            {teacher && <span>· {teacher}</span>}
          </p>
          {consult && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><MessagesSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />{t("schedule.session.consult", { day: f.shortDay(consult.startsAt), time: f.time(consult.startsAt), room: consult.room })}</p>}
          {plan && !auto && <p className="mt-1.5 text-[13px]"><Link href={`/grades#${encodeURIComponent(l.title)}`} className="font-medium text-primary underline-offset-2 hover:underline dark:text-accent-text">{plan.headline}</Link></p>}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-line bg-surface p-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("schedule.session.untilSession")}</p><p className="mt-1 font-serif text-2xl tabular">{daysLeft} <span className="text-base">{tn("schedule.session.days", daysLeft)}</span></p><p className="text-xs text-muted">{t("schedule.session.first", { date: f.dayMonth(first.startsAt) })}</p></div>
        <div className="rounded-2xl border border-line bg-surface p-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("schedule.session.toTake")}</p><p className="mt-1 font-serif text-2xl tabular">{items.length - autos.length}</p><p className="text-xs text-muted">{t("schedule.session.counts", { credits: credits.length, exams: exams.length })}</p></div>
        <div className="rounded-2xl border border-ok/40 bg-ok-bg p-3"><p className="text-xs font-semibold uppercase tracking-wider text-ok">{t("schedule.session.autoTitle")}</p><p className="mt-1 font-serif text-2xl tabular text-ok">{autos.length}</p><p className="text-xs text-ok">{t("schedule.session.autoNote")}</p></div>
      </div>
      {credits.length > 0 && (
        <section aria-labelledby="s-credits">
          <h2 id="s-credits" className="mb-2 flex items-center gap-2 font-serif text-xl font-bold"><Flag className="h-5 w-5 text-accent-text" aria-hidden />{t("schedule.session.creditWeek")}</h2>
          <ul className="grid gap-2.5 lg:grid-cols-2">{credits.map((l) => <Item key={l.id} l={l} />)}</ul>
        </section>
      )}
      {exams.length > 0 && (
        <section aria-labelledby="s-exams">
          <h2 id="s-exams" className="mb-2 flex items-center gap-2 font-serif text-xl font-bold"><GraduationCap className="h-5 w-5 text-accent-text" aria-hidden />{t("schedule.session.exams")}</h2>
          <ul className="grid gap-2.5 lg:grid-cols-2">{exams.map((l) => <Item key={l.id} l={l} />)}</ul>
        </section>
      )}
      <p className="text-xs text-muted">{t("schedule.session.footer")}</p>
    </div>
  );
}
