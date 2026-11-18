import type { Metadata } from "next";
import { requireStaff } from "@/server/auth/guards";
import { staffElectives } from "@/server/dal/electives";
import { fmt } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Курсы по выбору" };

/** Заполненность курсов по выбору (раунд 8): только цифры, без ФИО — чтобы решить, где открыть вторую группу. */
export default async function StaffElectivesPage() {
  const v = await requireStaff();
  const list = await staffElectives(v);
  const total = list.reduce((s, e) => s + e.capacity, 0), taken = list.reduce((s, e) => s + e.taken, 0), waiting = list.reduce((s, e) => s + e.waiting, 0);
  const closes = list[0]?.closesAt;
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Курсы по выбору" subtitle={`Весна 2027 · запись до ${closes ? fmt.dayMonth(closes) : "—"} · занято ${taken} из ${total} мест`} />
      {waiting > 0 && <p className="mb-4 rounded-xl border border-warn-line bg-warn-bg px-4 py-2.5 text-sm text-warn">В листах ожидания {waiting} чел. — если очередь длинная, стоит открыть вторую группу курса.</p>}
      <Card className="p-0">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Заполненность курсов">
          <table className="data-table w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3 font-semibold">Курс</th><th className="px-4 py-3 font-semibold">Преподаватель</th><th className="px-4 py-3 font-semibold">Заполненность</th><th className="px-4 py-3 text-right font-semibold">Лист ожидания</th></tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((e) => {
                const pct = Math.round((e.taken / e.capacity) * 100);
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3"><p className="font-semibold">{e.title}</p><p className="text-xs text-muted">{e.slot} · {e.credits} з.е.{e.minCourse > 1 ? ` · с ${e.minCourse} курса` : ""}</p></td>
                    <td className="px-4 py-3">{e.teacher}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2"><div className="h-2 w-32 overflow-hidden rounded-full bg-surface-2"><div className={cn("h-full rounded-full", pct >= 100 ? "bg-danger" : pct >= 85 ? "bg-warn" : "bg-primary dark:bg-accent/80")} style={{ width: `${pct}%` }} /></div><span className="tabular">{e.taken}/{e.capacity}</span></div>
                    </td>
                    <td className="px-4 py-3 text-right tabular">{e.waiting || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
