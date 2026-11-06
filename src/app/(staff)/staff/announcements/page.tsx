import type { Metadata } from "next";
import { requireStaff } from "@/server/auth/guards";
import { staffAudienceOptions, staffListAnnouncements } from "@/server/dal/staff";
import { fmt } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementForm } from "@/components/staff/announcement-form";

export const metadata: Metadata = { title: "Объявления — деканат" };
const AUD = { ALL: "всем", FACULTY: "факультету", COURSE: "курсу", GROUP: "группе" } as const;

export default async function StaffAnnouncementsPage() {
  await requireStaff();
  const [opts, list] = await Promise.all([staffAudienceOptions(), staffListAnnouncements()]);
  const fac = new Map(opts.faculties.map((f) => [f.id, f.code]));
  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Объявления" subtitle="Адресно: всем, факультету, курсу или одной группе — каждый адресат получит уведомление" />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card><CardTitle>Новое объявление</CardTitle><AnnouncementForm faculties={opts.faculties.map((f) => ({ id: f.id, code: f.code }))} groups={opts.groups.map((g) => ({ id: g.id, label: `${g.faculty} · гр. ${g.name}` }))} /></Card>
        <Card>
          <CardTitle>Опубликованные</CardTitle>
          <ul className="divide-y divide-line">
            {list.map((a) => (
              <li key={a.id} className="py-2.5">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">{fmt.dateTime(a.publishedAt)} · {a.source} · <Badge>{AUD[a.audience]}{a.facultyId ? ` ${fac.get(a.facultyId)}` : ""}{a.course ? `, ${a.course} курс` : ""}</Badge>{a.important && <Badge tone="danger">важное</Badge>}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
