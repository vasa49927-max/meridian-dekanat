import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { requireStaff } from "@/server/auth/guards";
import { staffRiskList } from "@/server/dal/risks";
import { BRS } from "@/lib/brs";
import { fmt, plural } from "@/lib/time";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { InviteButton } from "@/components/staff/invite-button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Риски студентов" };

/**
 * Раннее предупреждение (раунд 6, №2). Тот же расчёт БРС, что видит студент на странице «Успеваемость».
 * Цель — помочь до сессии, а не наказать: единственное действие — пригласить на консультацию.
 */
export default async function RisksPage({ searchParams }: { searchParams: Promise<{ level?: string; group?: string }> }) {
  const v = await requireStaff();
  const sp = await searchParams;
  const all = await staffRiskList(v);
  const groups = [...new Set(all.map((r) => `${r.faculty} · ${r.group}`))].sort();
  const level = sp.level === "high" || sp.level === "watch" ? sp.level : "all";
  const rows = all.filter((r) => (level === "all" || r.summary.risk === level) && (!sp.group || `${r.faculty} · ${r.group}` === sp.group));
  const high = all.filter((r) => r.summary.risk === "high").length;
  const students = new Set(all.map((r) => r.studentId)).size;
  const q = (p: Record<string, string | undefined>) => { const u = new URLSearchParams(Object.entries({ level: level === "all" ? undefined : level, group: sp.group, ...p }).filter(([, x]) => x) as [string, string][]); const s = u.toString(); return `/staff/risks${s ? `?${s}` : ""}`; };

  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title="Риски студентов" subtitle="Кому стоит помочь до сессии — по баллам БРС текущего семестра" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Студентов с риском</p><p className="mt-1 font-serif text-3xl tabular">{students}</p></Card>
        <Card className={cn("p-4", high > 0 && "border-danger/40")}><p className="text-xs font-semibold uppercase tracking-wider text-muted">Высокий риск</p><p className={cn("mt-1 font-serif text-3xl tabular", high > 0 && "text-danger")}>{high}</p><p className="text-xs text-muted">не набрать {BRS.passTotal} даже с экзаменом</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Под наблюдением</p><p className="mt-1 font-serif text-3xl tabular">{all.length - high}</p><p className="text-xs text-muted">темп ниже 60% от возможного</p></Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav aria-label="Уровень риска" className="seg inline-flex rounded-xl border border-line p-1">
          {([["all", "Все"], ["high", "Высокий"], ["watch", "Наблюдение"]] as const).map(([k, l]) => (
            <Link key={k} href={q({ level: k === "all" ? undefined : k })} aria-current={level === k ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", level === k ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")}>{l}</Link>
          ))}
        </nav>
        {groups.length > 1 && (
          <nav aria-label="Группа" className="flex flex-wrap gap-1.5">
            <Link href={q({ group: undefined })} className={cn("rounded-full border px-3 py-1 text-sm", !sp.group ? "border-primary bg-primary-soft font-semibold text-primary dark:text-accent-text" : "border-line text-muted hover:text-fg")}>Все группы</Link>
            {groups.map((g) => <Link key={g} href={q({ group: g })} className={cn("rounded-full border px-3 py-1 text-sm", sp.group === g ? "border-primary bg-primary-soft font-semibold text-primary dark:text-accent-text" : "border-line text-muted hover:text-fg")}>{g}</Link>)}
          </nav>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="Рисков не видно">По выбранным условиям у всех студентов темп достаточный.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const s = r.summary;
            const pct = Math.min(100, (s.earned / BRS.currentMax) * 100);
            const possible = Math.min(100, ((s.earned + s.remainingMax) / BRS.currentMax) * 100);
            return (
              <Card as="li" key={`${r.studentId}:${r.offeringId}`} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-muted">{r.faculty} · {r.course} курс · группа {r.group}</p>
                  </div>
                  <Badge tone={s.risk === "high" ? "danger" : "warn"} className="inline-flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" aria-hidden />{s.risk === "high" ? "Высокий риск" : "Наблюдение"}</Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="min-w-0">
                    <p className="text-sm"><b>{r.discipline}</b> — {s.riskReason}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                      <div className="relative h-2 flex-1 rounded-full bg-surface-2" role="img" aria-label={`Набрано ${s.earned} из ${BRS.currentMax}, ещё можно набрать ${s.remainingMax}`}>
                        <div className="absolute inset-y-0 left-0 rounded-full bg-line" style={{ width: `${possible}%` }} />
                        <div className={cn("absolute inset-y-0 left-0 rounded-full", s.risk === "high" ? "bg-danger" : "bg-warn")} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="shrink-0 tabular">{s.earned} из {BRS.currentMax} · темп {s.pacePct}%</span>
                    </div>
                  </div>
                  <InviteButton studentId={r.studentId} offeringId={r.offeringId} label={`Пригласить ${r.name} на консультацию по дисциплине «${r.discipline}»`} invited={r.invitedAt ? `Приглашён(а) ${fmt.dayMonth(r.invitedAt)}` : null} />
                </div>
              </Card>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">Студент видит тот же расчёт у себя в «Успеваемости». Показано {rows.length} {plural(rows.length, "строка", "строки", "строк")}; серая часть полосы — сколько ещё можно набрать в текущем контроле.</p>
    </div>
  );
}
