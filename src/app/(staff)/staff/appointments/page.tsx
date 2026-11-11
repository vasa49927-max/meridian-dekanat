import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { staffAppointments } from "@/server/dal/staff";
import { fmt, now, nearDay } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";

export const metadata: Metadata = { title: "Приём студентов — деканат" };

export default async function StaffAppointmentsPage() {
  const v = await requireStaff();
  const at = now();
  const list = await staffAppointments(v, at);
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Приём студентов" subtitle="Вт и чт, 14:00–17:00, слоты по 20 минут — студенты записываются сами" />
      {list.length ? (
        <Card className="p-0 lg:p-0">
          <ul className="divide-y divide-line">
            {list.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                <div className="w-28 shrink-0"><p className="font-semibold tabular">{fmt.time(a.startsAt)}</p><p className="text-xs text-muted">{fmt.dayMonth(a.startsAt)}, {nearDay(a.startsAt, at) ?? fmt.weekdayShort(a.startsAt)}</p></div>
                <div className="min-w-0 flex-1"><p className="font-medium">{a.lastName} {a.firstName} · {a.faculty}, гр. {a.group}</p><p className="text-sm text-muted">{a.topic}{a.comment ? ` — ${a.comment}` : ""}</p></div>
              </li>
            ))}
          </ul>
        </Card>
      ) : <EmptyState icon={<CalendarClock />} title="Записей пока нет" />}
    </div>
  );
}
