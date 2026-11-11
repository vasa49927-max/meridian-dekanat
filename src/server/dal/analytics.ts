import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import type { StaffViewer } from "@/server/auth/guards";
import { addDays, dayKey, now, startOfDay } from "@/lib/time";

/**
 * Панель руководителя деканата (раунд 6). Все цифры — агрегаты, без персональных данных студентов.
 * «Время обработки» — от подачи до первого итогового статуса (готова / отклонена); «в срок» — не позже dueAt.
 */
type Row = Record<string, unknown>;
const num = (v: unknown) => (v == null ? null : Number(v));

export async function staffAnalytics(_v: StaffViewer, days: number) {
  const at = now();
  const from = addDays(startOfDay(at), -(days - 1));
  const prevFrom = addDays(from, -days);

  // Итоговое событие по каждой заявке: первое READY или REJECTED
  const closedCte = sql`
    with closed as (
      select r.id, r.type_id, r.assignee_staff_id, r.created_at, r.due_at, min(e.created_at) as closed_at
      from requests r join request_events e on e.request_id = r.id and e.status in ('READY', 'REJECTED')
      group by r.id
    )`;

  const [kpi] = (await db.execute(sql`${closedCte}
    select
      (select count(*) from requests where created_at >= ${from}) as received,
      (select count(*) from requests where created_at >= ${prevFrom} and created_at < ${from}) as received_prev,
      (select count(*) from closed where closed_at >= ${from}) as closed,
      (select avg(extract(epoch from closed_at - created_at)) / 3600 from closed where closed_at >= ${from}) as avg_hours,
      (select avg(extract(epoch from closed_at - created_at)) / 3600 from closed where closed_at >= ${prevFrom} and closed_at < ${from}) as avg_hours_prev,
      (select 100.0 * count(*) filter (where closed_at <= due_at) / nullif(count(*), 0) from closed where closed_at >= ${from}) as on_time_pct,
      (select count(*) from requests where status in ('SUBMITTED', 'IN_PROGRESS') and due_at < ${at}) as overdue,
      (select count(*) from requests where status in ('SUBMITTED', 'IN_PROGRESS', 'NEEDS_INFO', 'READY')) as open,
      (select avg(rating) from request_feedback where created_at >= ${from}) as rating,
      (select count(*) from request_feedback where created_at >= ${from}) as ratings
  `)).rows as Row[];

  const perDay = (await db.execute(sql`
    select to_char(created_at at time zone 'Europe/Moscow', 'YYYY-MM-DD') as day, count(*) as n
    from requests where created_at >= ${from} group by 1 order by 1`)).rows as Row[];
  const byDay = new Map(perDay.map((r) => [String(r.day), Number(r.n)]));
  const daysSeries = Array.from({ length: days }, (_, i) => { const d = addDays(from, i); return { day: d, key: dayKey(d), n: byDay.get(dayKey(d)) ?? 0 }; });

  const byType = ((await db.execute(sql`${closedCte}
    select t.title, count(r.id) as received,
      (select avg(extract(epoch from c.closed_at - c.created_at)) / 3600 from closed c where c.type_id = t.id and c.closed_at >= ${from}) as avg_hours,
      t.sla_days
    from request_types t left join requests r on r.type_id = t.id and r.created_at >= ${from}
    group by t.id order by received desc, t.title`)).rows as Row[])
    .map((r) => ({ title: String(r.title), received: Number(r.received), avgHours: num(r.avg_hours), slaDays: Number(r.sla_days) }));

  const byStaff = ((await db.execute(sql`${closedCte}
    select s.id, s.last_name, s.first_name, s.middle_name,
      (select count(*) from closed c where c.assignee_staff_id = s.id and c.closed_at >= ${from}) as closed,
      (select avg(extract(epoch from c.closed_at - c.created_at)) / 3600 from closed c where c.assignee_staff_id = s.id and c.closed_at >= ${from}) as avg_hours,
      (select 100.0 * count(*) filter (where c.closed_at <= c.due_at) / nullif(count(*), 0) from closed c where c.assignee_staff_id = s.id and c.closed_at >= ${from}) as on_time_pct,
      (select count(*) from requests r where r.assignee_staff_id = s.id and r.status in ('SUBMITTED', 'IN_PROGRESS', 'NEEDS_INFO')) as in_work,
      (select avg(f.rating) from request_feedback f join requests r on r.id = f.request_id where r.assignee_staff_id = s.id and f.created_at >= ${from}) as rating
    from staff s order by closed desc`)).rows as Row[])
    .map((r) => ({ id: String(r.id), name: `${r.last_name} ${String(r.first_name)[0]}. ${r.middle_name ? `${String(r.middle_name)[0]}.` : ""}`.trim(), closed: Number(r.closed), avgHours: num(r.avg_hours), onTimePct: num(r.on_time_pct), inWork: Number(r.in_work), rating: num(r.rating) }));

  // Нагрузка по дням недели (для «пиков»): сколько заявок приходит в пн…вс
  const byWeekday = ((await db.execute(sql`
    select extract(isodow from created_at at time zone 'Europe/Moscow')::int as wd, count(*) as n
    from requests where created_at >= ${from} group by 1 order by 1`)).rows as Row[]).map((r) => ({ wd: Number(r.wd), n: Number(r.n) }));

  const k = kpi ?? {};
  return {
    days, from, at,
    kpi: {
      received: Number(k.received ?? 0), receivedPrev: Number(k.received_prev ?? 0), closed: Number(k.closed ?? 0),
      avgHours: num(k.avg_hours), avgHoursPrev: num(k.avg_hours_prev), onTimePct: num(k.on_time_pct),
      overdue: Number(k.overdue ?? 0), open: Number(k.open ?? 0), rating: num(k.rating), ratings: Number(k.ratings ?? 0),
    },
    daysSeries, byType, byStaff, byWeekday,
  };
}
export type Analytics = Awaited<ReturnType<typeof staffAnalytics>>;
