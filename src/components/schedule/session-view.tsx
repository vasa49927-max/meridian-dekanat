import Link from "next/link";
import { CheckCircle2, Flag, GraduationCap, MapPin, MessagesSquare } from "lucide-react";
import type { StudentViewer } from "@/server/auth/guards";
import { getMyGrades, listMyLessons } from "@/server/dal/student";
import { planFor } from "@/lib/brs";
import { addDays, fmt, msk, mskParts, plural, startOfDay } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { teacherShort } from "./lesson-meta";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";
import { planText } from "@/i18n/brs";

/**
 * Вкладка «Сессия» (раунд 3): зачёты и экзамены с консультациями одним списком.
 * У каждого — связь с «Успеваемостью»: если автомат уже есть, так и пишем «можно не сдавать».
 */
export async function SessionView({ v, at }: { v: StudentViewer; at: Date }) {
  const { t } = await getI18n();
  const p = mskParts(at);
  // Ближайшая сессия: зимняя (декабрь–январь) или летняя (июнь–июль).
  const from = p.m >= 8 || p.m === 1 ? msk(p.m === 1 ? p.y - 1 : p.y, 12, 1) : msk(p.y, 6, 1);
  const to = addDays(from, 62);
  const [lessons, grades] = await Promise.all([listMyLessons(v, from, to), getMyGrades(v)]);
  const items = lessons.filter((l) => l.type === "EXAM" || l.type === "CREDIT");
  const consults = lessons.filter((l) => l.type === "CONSULTATION");
  const byName = new Map(grades.current.map((d) => [d.name, d]));
  if (!items.length) return <EmptyState icon={<GraduationCap />} title="Расписание сессии ещё не опубликовано">Обычно его публикуют за месяц до начала. Мы пришлём уведомление.</EmptyState>;

  const first = items[0];
  const daysLeft = Math.max(0, Math.round((+startOfDay(first.startsAt) - +startOfDay(at)) / 86400000));
  const autos = items.filter((l) => byName.get(l.title)?.summary.auto?.achieved);
  const credits = items.filter((l) => l.type === "CREDIT");
  const exams = items.filter((l) => l.type === "EXAM");

  const Item = ({ l }: { l: (typeof items)[number] }) => {
    const d = byName.get(l.title);
    const plan = d ? planText(planFor(d.control, d.summary), d.summary, t) : null;
    const auto = d?.summary.auto?.achieved;
    const consult = consults.find((c) => c.title === l.title && c.startsAt < l.startsAt);
    return (
      <li className={cn("grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border bg-surface p-3.5 sm:grid-cols-[88px_minmax(0,1fr)]", auto ? "border-ok/40" : "border-line")}>
        <div className="self-start rounded-xl bg-surface-2 py-2 text-center">
          <p className="font-serif text-3xl font-bold leading-none tabular">{mskParts(l.startsAt).d}</p>
          <p className="text-xs text-muted">{fmt.dayMonth(l.startsAt).split(" ")[1]}</p>
          <p className="mt-0.5 text-xs font-semibold uppercase text-muted">{fmt.weekdayShort(l.startsAt)}</p>
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={l.type === "EXAM" ? "primary" : "neutral"}>{l.type === "EXAM" ? "Экзамен" : d?.control === "GRADED_CREDIT" ? "Дифф. зачёт" : "Зачёт"}</Badge>
            {auto && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" aria-hidden />автомат — можно не сдавать</Badge>}
          </div>
          <h3 className="font-semibold leading-snug">{l.title}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            <span className="font-semibold text-fg tabular">{fmt.time(l.startsAt)}–{fmt.time(l.endsAt)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />ауд. {l.room}, {l.buildingName}</span>
            {teacherShort(l) && <span>· {teacherShort(l)}</span>}
          </p>
          {consult && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><MessagesSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />Консультация: {fmt.shortDay(consult.startsAt)}, {fmt.time(consult.startsAt)}, ауд. {consult.room}</p>}
          {plan && !auto && <p className="mt-1.5 text-[13px]"><Link href={`/grades#${encodeURIComponent(l.title)}`} className="font-medium text-primary underline-offset-2 hover:underline dark:text-accent-text">{plan.headline}</Link></p>}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-line bg-surface p-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted">До сессии</p><p className="mt-1 font-serif text-2xl tabular">{daysLeft} <span className="text-base">{plural(daysLeft, "день", "дня", "дней")}</span></p><p className="text-xs text-muted">первый — {fmt.dayMonth(first.startsAt)}</p></div>
        <div className="rounded-2xl border border-line bg-surface p-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Сдавать</p><p className="mt-1 font-serif text-2xl tabular">{items.length - autos.length}</p><p className="text-xs text-muted">{credits.length} зач. · {exams.length} экз.</p></div>
        <div className="rounded-2xl border border-ok/40 bg-ok-bg p-3"><p className="text-xs font-semibold uppercase tracking-wider text-ok">Автоматом</p><p className="mt-1 font-serif text-2xl tabular text-ok">{autos.length}</p><p className="text-xs text-ok">по баллам семестра</p></div>
      </div>
      {credits.length > 0 && (
        <section aria-labelledby="s-credits">
          <h2 id="s-credits" className="mb-2 flex items-center gap-2 font-serif text-xl font-bold"><Flag className="h-5 w-5 text-accent-text" aria-hidden />Зачётная неделя</h2>
          <ul className="grid gap-2.5 lg:grid-cols-2">{credits.map((l) => <Item key={l.id} l={l} />)}</ul>
        </section>
      )}
      {exams.length > 0 && (
        <section aria-labelledby="s-exams">
          <h2 id="s-exams" className="mb-2 flex items-center gap-2 font-serif text-xl font-bold"><GraduationCap className="h-5 w-5 text-accent-text" aria-hidden />Экзамены</h2>
          <ul className="grid gap-2.5 lg:grid-cols-2">{exams.map((l) => <Item key={l.id} l={l} />)}</ul>
        </section>
      )}
      <p className="text-xs text-muted">Расписание сессии попадёт и в подписку на календарь. Перенос экзамена по уважительной причине — заявка «Перенос экзамена / пересдача».</p>
    </div>
  );
}
