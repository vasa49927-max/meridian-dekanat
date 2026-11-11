import type { Metadata } from "next";
import { CalendarClock, MapPin } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { listFreeSlots, listMyAppointments } from "@/server/dal/appointments";
import { dayKey, now } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Booking } from "@/components/appointments/booking";
import { cancelAppointmentAction } from "./actions";
import { ConfirmForm } from "@/components/ui/confirm";
import { getI18n } from "@/i18n/server";

/** Темы визита: в БД сохраняется русское значение, подпись — на языке интерфейса. */
const TOPICS = [
  { value: "Справки и документы", key: "docs" },
  { value: "Индивидуальный график", key: "plan" },
  { value: "Пересдача / академическая разница", key: "retake" },
  { value: "Перевод, восстановление, академический отпуск", key: "transfer" },
  { value: "Оформление темы ВКР", key: "thesis" },
  { value: "Другое", key: "misc" },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("appointments.title") };
}

export default async function AppointmentsPage() {
  const v = await requireStudent();
  const { t, tr, name, f } = await getI18n();
  const at = now();
  const [slots, mine] = await Promise.all([listFreeSlots(at), listMyAppointments(v)]);
  const upcoming = mine.filter((a) => a.status === "BOOKED" && a.startsAt > at);
  const history = mine.filter((a) => !(a.status === "BOOKED" && a.startsAt > at)).slice(0, 5);
  const topicLabel = (topic: string) => {
    const known = TOPICS.find((x) => x.value === topic);
    return known ? t(`appointments.topics.${known.key}`) : topic;
  };
  const staffShort = (a: { staffLast: string; staffFirst: string; staffMiddle: string | null }) =>
    `${name(a.staffLast)} ${name(a.staffFirst).charAt(0)}. ${name(a.staffMiddle).charAt(0)}.`;
  const days = [...new Set(slots.map((s) => dayKey(s.startsAt)))].map((k) => {
    const list = slots.filter((s) => dayKey(s.startsAt) === k);
    const d0 = list[0].startsAt; const near = f.near(d0, at);
    return { key: k, label: f.dayMonth(d0), date: near ? t("appointments.dayNear", { near, weekday: f.weekdayShort(d0) }) : f.weekday(d0), slots: list.map((s) => ({ id: s.id, time: f.time(s.startsAt) })) };
  });
  const s0 = slots[0];
  const position = s0 ? tr("positions", s0.position) : "";
  const staff = s0 ? `${name(s0.staffLast)} ${name(s0.staffFirst)} ${name(s0.staffMiddle)}, ${f.locale === "ru" ? position.toLowerCase() : position}` : "";
  return (
    <div className="mx-auto max-w-3xl pt-2 lg:pt-0">
      <PageHeader title={t("appointments.title")} subtitle={t("appointments.subtitle")} />
      {upcoming.length > 0 && (
        <Card className="mb-4">
          <CardTitle>{t("appointments.mine")}</CardTitle>
          <ul className="divide-y divide-line">
            {upcoming.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{f.dateTime(a.startsAt)}–{f.time(a.endsAt)} <Badge tone={f.near(a.startsAt, at) ? "ok" : "neutral"} className="ml-1">{f.near(a.startsAt, at) ?? f.weekday(a.startsAt)}</Badge></p>
                  <p className="text-sm">{topicLabel(a.topic)}</p>
                  <p className="flex items-center gap-1 text-[13px] text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden />{tr("offices", a.location)} · {staffShort(a)}</p>
                </div>
                <ConfirmForm action={cancelAppointmentAction} hidden={{ id: a.id }} trigger={t("appointments.cancel")} triggerClassName="h-10 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-bg"
                  title={t("appointments.cancelTitle")} description={t("appointments.cancelText", { day: f.shortDay(a.startsAt), time: f.time(a.startsAt), topic: topicLabel(a.topic) })} confirmLabel={t("appointments.cancelConfirm")} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <CardTitle>{t("appointments.newTitle")}</CardTitle>
        {days.length ? <Booking days={days} staff={staff} location={tr("offices", s0?.location)} topics={TOPICS.map((x) => ({ value: x.value, label: t(`appointments.topics.${x.key}`) }))} />
          : <EmptyState icon={<CalendarClock />} title={t("appointments.emptyTitle")}>{t("appointments.emptyText")}</EmptyState>}
      </Card>
      {history.length > 0 && (
        <details className="mt-4 card rounded-2xl border border-line bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">{t("appointments.history")}</summary>
          <ul className="mt-2 space-y-1 text-muted">{history.map((a) => <li key={a.id}>{f.dateTime(a.startsAt)} — {topicLabel(a.topic)} · {a.status === "CANCELLED" ? t("appointments.cancelled") : t("appointments.done")}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
