import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock, Inbox, Lightbulb, Star, Timer } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { staffAnalytics } from "@/server/dal/analytics";
import { fmt, plural } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/staff/bar-chart";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Панель руководителя" };

const WD_SHORT = ["", "пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const WD = ["", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
/** «2,4 дня» / «5 ч» — человеческая длительность. */
const dur = (h: number | null) => (h === null ? "—" : h < 24 ? `${Math.max(1, Math.round(h))} ч` : `${(h / 24).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} дн.`);
const n1 = (x: number | null) => (x === null ? "—" : x.toLocaleString("ru-RU", { maximumFractionDigits: 1 }));

/**
 * Панель руководителя деканата (раунд 6, улучшение №1): поток обращений, сроки, качество, нагрузка на методистов.
 * Только агрегаты — без ФИО студентов. Данные демо-периода — вымышленные.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const v = await requireStaff();
  const { d } = await searchParams;
  const days = d === "7" ? 7 : d === "60" ? 60 : 30;
  const a = await staffAnalytics(v, days);
  const k = a.kpi;
  const trend = (cur: number | null, prev: number | null, lowerIsBetter = false) => {
    if (cur === null || prev === null || prev === 0) return null;
    const pct = Math.round(((cur - prev) / prev) * 100);
    if (pct === 0) return null;
    const good = lowerIsBetter ? pct < 0 : pct > 0;
    return { pct, good };
  };
  const tRecv = trend(k.received, k.receivedPrev);
  const tTime = trend(k.avgHours, k.avgHoursPrev, true);

  // Подсказки «что улучшить» — из тех же цифр
  const slowest = a.byType.filter((x) => x.avgHours !== null && x.received > 0).sort((x, y) => y.avgHours! / (y.slaDays * 24) - x.avgHours! / (x.slaDays * 24))[0];
  const peak = [...a.byWeekday].sort((x, y) => y.n - x.n)[0];
  const busiest = [...a.byStaff].sort((x, y) => y.inWork - x.inWork)[0];
  const insights = [
    k.overdue > 0 && `Сейчас просрочено ${k.overdue} ${plural(k.overdue, "заявка", "заявки", "заявок")} — откройте фильтр «Просрочены» в очереди.`,
    slowest && `Дольше нормы относительно срока: «${slowest.title}» — в среднем ${dur(slowest.avgHours)} при сроке ${slowest.slaDays} ${plural(slowest.slaDays, "рабочий день", "рабочих дня", "рабочих дней")}.`,
    peak && peak.n > 0 && `Пик обращений — ${WD[peak.wd]}. В этот день стоит усилить приём в студенческом офисе.`,
    busiest && busiest.inWork > 0 && `Больше всего заявок в работе у ${busiest.name} (${busiest.inWork}) — можно перераспределить через «Взять себе».`,
  ].filter(Boolean) as string[];

  const tiles = [
    { icon: Inbox, label: "Поступило", value: String(k.received), sub: `за ${days} ${plural(days, "день", "дня", "дней")}`, t: tRecv, tLabel: "к пред. периоду" },
    { icon: Clock, label: "Среднее время обработки", value: dur(k.avgHours), sub: `закрыто ${k.closed}`, t: tTime, tLabel: "к пред. периоду" },
    { icon: Timer, label: "Закрыто в срок", value: k.onTimePct === null ? "—" : `${Math.round(k.onTimePct)}%`, sub: "от закрытых за период", t: null, tLabel: "" },
    { icon: AlertTriangle, label: "Просрочено сейчас", value: String(k.overdue), sub: `открытых всего ${k.open}`, t: null, tLabel: "", danger: k.overdue > 0 },
    { icon: Star, label: "Оценка студентов", value: k.rating === null ? "—" : `${n1(k.rating)} из 5`, sub: `${k.ratings} ${plural(k.ratings, "отзыв", "отзыва", "отзывов")}`, t: null, tLabel: "" },
  ];
  const maxType = Math.max(1, ...a.byType.map((x) => x.received));

  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Панель руководителя" subtitle={`Как работает студенческий офис: ${fmt.dayMonth(a.from)} — ${fmt.dayMonth(a.at)}`}
        action={<nav aria-label="Период" className="seg inline-flex rounded-xl border border-line p-1">
          {[7, 30, 60].map((x) => <Link key={x} href={`/staff/analytics?d=${x}`} aria-current={days === x ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", days === x ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}>{x} дн.</Link>)}
        </nav>} />

      <section aria-label="Ключевые показатели" className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((x) => (
          <Card key={x.label} className={cn("p-4", x.danger && "border-danger/40")}>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><x.icon className="h-4 w-4" aria-hidden />{x.label}</p>
            <p className={cn("mt-1 font-serif text-3xl tabular", x.danger && "text-danger")}>{x.value}</p>
            <p className="text-xs text-muted">{x.sub}</p>
            {x.t && <p className={cn("mt-1 inline-flex items-center gap-0.5 text-xs font-semibold", x.t.good ? "text-ok" : "text-danger")}>{x.t.pct > 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}{x.t.pct > 0 ? "+" : ""}{x.t.pct}% {x.tLabel}</p>}
          </Card>
        ))}
      </section>

      {insights.length > 0 && (
        <section aria-labelledby="ins-h" className="mb-4 rounded-2xl border border-primary/25 bg-primary-soft p-4 dark:border-accent/30">
          <h2 id="ins-h" className="mb-2 flex items-center gap-2 font-semibold"><Lightbulb className="h-5 w-5 text-primary dark:text-accent-text" aria-hidden />Что стоит сделать</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">{insights.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardTitle>Поток заявок по дням</CardTitle>
          <BarChart height={220} label={`Заявок в день за ${days} дн.`} unit="заявок" data={a.daysSeries.map((x) => ({ key: x.key, label: fmt.shortDay(x.day), short: fmt.dayMonth(x.day).split(" ")[0], value: x.n }))} />
          <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">По дням недели</h3>
          <ul className="grid grid-cols-7 gap-1.5 text-center text-xs" aria-label="Заявок по дням недели">
            {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
              const n = a.byWeekday.find((x) => x.wd === wd)?.n ?? 0;
              const max = Math.max(1, ...a.byWeekday.map((x) => x.n));
              return (
                <li key={wd} className="flex flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end justify-center rounded-lg bg-surface-2/60"><div className="w-3/5 rounded-t-[4px] bg-primary dark:bg-accent/80" style={{ height: `${(n / max) * 100}%` }} /></div>
                  <span className="tabular font-semibold">{n}</span><span className="text-muted">{WD_SHORT[wd]}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardTitle>Виды заявок</CardTitle>
          <ul className="space-y-2.5">
            {a.byType.map((x) => (
              <li key={x.title} className="text-sm">
                <div className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate">{x.title}</span><span className="shrink-0 tabular"><b>{x.received}</b> <span className="text-muted">· {dur(x.avgHours)}</span></span></div>
                <div className="mt-1 h-2 rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary dark:bg-accent/80" style={{ width: `${(x.received / maxType) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Число — поступило за период; время — среднее до готовности.</p>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle>Методисты</CardTitle>
        <div className="-mx-4 overflow-x-auto px-4" tabIndex={0} role="region" aria-label="Таблица методистов">
          <table className="data-table w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted"><tr><th className="py-2 font-semibold">Сотрудник</th><th className="py-2 text-right font-semibold">Закрыто</th><th className="py-2 text-right font-semibold">Среднее время</th><th className="py-2 text-right font-semibold">В срок</th><th className="py-2 text-right font-semibold">В работе</th><th className="py-2 text-right font-semibold">Оценка</th></tr></thead>
            <tbody className="divide-y divide-line">
              {a.byStaff.map((x) => (
                <tr key={x.id}><td className="py-2">{x.name}{x.id === v.staffId && <span className="ml-1.5 text-xs text-muted">(вы)</span>}</td><td className="py-2 text-right tabular">{x.closed}</td><td className="py-2 text-right tabular">{dur(x.avgHours)}</td><td className="py-2 text-right tabular">{x.onTimePct === null ? "—" : `${Math.round(x.onTimePct)}%`}</td><td className="py-2 text-right tabular">{x.inWork}</td><td className="py-2 text-right tabular">{n1(x.rating)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">Цифры — чтобы распределять нагрузку и видеть узкие места процесса, а не для оценки людей по одному показателю.</p>
      </Card>
    </div>
  );
}
