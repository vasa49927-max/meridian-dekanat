import type { Metadata } from "next";
import { CalendarClock, MapPin } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listFreeSlots, listMyAppointments } from "@/server/dal/appointments";
import { dayKey, fmt, now, nearDay } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Booking } from "@/components/appointments/booking";
import { cancelAppointmentAction } from "./actions";
import { ConfirmForm } from "@/components/ui/confirm";

export const metadata: Metadata = { title: "Запись к методисту" };

export default async function AppointmentsPage() {
  const v = await requireStudent();
  const at = now();
  const [slots, mine] = await Promise.all([listFreeSlots(at), listMyAppointments(v)]);
  const upcoming = mine.filter((a) => a.status === "BOOKED" && a.startsAt > at);
  const history = mine.filter((a) => !(a.status === "BOOKED" && a.startsAt > at)).slice(0, 5);
  const days = [...new Set(slots.map((s) => dayKey(s.startsAt)))].map((k) => {
    const list = slots.filter((s) => dayKey(s.startsAt) === k);
    const d0 = list[0].startsAt; const near = nearDay(d0, at);
    return { key: k, label: fmt.dayMonth(d0), date: near ? `${near}, ${fmt.weekdayShort(d0)}` : fmt.weekday(d0), slots: list.map((s) => ({ id: s.id, time: fmt.time(s.startsAt) })) };
  });
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <PageHeader title="Запись к методисту" subtitle="Вместо живой очереди у двери: выберите время — придите ровно к нему" />
      {upcoming.length > 0 && (
        <Card className="mb-4">
          <CardTitle>Мои записи</CardTitle>
          <ul className="divide-y divide-line">
            {upcoming.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{fmt.dayMonth(a.startsAt)}, {fmt.time(a.startsAt)}–{fmt.time(a.endsAt)} <Badge tone={nearDay(a.startsAt, at) ? "ok" : "neutral"} className="ml-1">{nearDay(a.startsAt, at) ?? fmt.weekday(a.startsAt)}</Badge></p>
                  <p className="text-sm">{a.topic}</p>
                  <p className="flex items-center gap-1 text-[13px] text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden />{a.location} · {a.staffLast} {a.staffFirst[0]}. {a.staffMiddle?.[0]}.</p>
                </div>
                <ConfirmForm action={cancelAppointmentAction} hidden={{ id: a.id }} trigger="Отменить" triggerClassName="h-10 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-bg"
                  title="Отменить запись?" description={`${fmt.shortDay(a.startsAt)}, ${fmt.time(a.startsAt)} — «${a.topic}». Время освободится, и его может занять другой студент.`} confirmLabel="Да, отменить запись" />
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <CardTitle>Новая запись</CardTitle>
        {days.length ? <Booking days={days} staff={slots[0] ? `${slots[0].staffLast} ${slots[0].staffFirst} ${slots[0].staffMiddle ?? ""}, ${slots[0].position.toLowerCase()}` : ""} location={slots[0]?.location ?? ""} />
          : <EmptyState icon={<CalendarClock />} title="Свободных окон нет">Новые слоты появляются каждый понедельник. Срочный вопрос — задайте помощнику.</EmptyState>}
      </Card>
      {history.length > 0 && (
        <details className="mt-4 rounded-2xl border border-line bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Прошлые и отменённые записи</summary>
          <ul className="mt-2 space-y-1 text-muted">{history.map((a) => <li key={a.id}>{fmt.dayMonth(a.startsAt)}, {fmt.time(a.startsAt)} — {a.topic} · {a.status === "CANCELLED" ? "отменена" : "состоялась"}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
