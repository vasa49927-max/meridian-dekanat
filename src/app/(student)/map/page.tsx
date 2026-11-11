import { Info, MapPin, Navigation } from "lucide-react";
import { requireStudent } from "@/server/auth/guards";
import { db, schema as t } from "@/server/db";
import { CAMPUS_BUILDINGS, routeTo } from "@/lib/campus";
import { getI18n } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { MoscowPlan, OdintsovoPlan } from "@/components/campus/campus-plan";

export async function generateMetadata() {
  const { t: tt } = await getI18n();
  return { title: tt("campus.title") };
}

/** «Как пройти»: условная (вымышленная) схема кампуса и пошаговый маршрут. Раунд 6, улучшение №5. */
export default async function MapPage({ searchParams }: { searchParams: Promise<{ room?: string; b?: string }> }) {
  await requireStudent();
  const sp = await searchParams;
  const { t: tt, tr, name } = await getI18n();
  const buildings = await db.select().from(t.buildings);
  const room = (sp.room ?? "").slice(0, 12);
  const code = CAMPUS_BUILDINGS.includes((sp.b ?? "") as (typeof CAMPUS_BUILDINGS)[number]) ? sp.b! : "";
  const route = code ? routeTo(room, code) : null;
  const bInfo = buildings.find((x) => x.code === code);
  const codes = Object.fromEntries(CAMPUS_BUILDINGS.map((c) => [c, c === "ВУЦ" ? tt("campus.vucCode") : name(c)]));
  const l = { aria: tt("campus.plan.aria"), avenue: tt("campus.plan.avenue"), entrance: tt("campus.plan.entrance"), bridge: tt("campus.plan.bridge"), vucEntrance: tt("campus.plan.vucEntrance"), bus: tt("campus.plan.bus"), street: tt("campus.plan.street"), basement: tt("campus.plan.basement"), target: tt("campus.plan.target") };
  const stepText = (s: NonNullable<typeof route>["steps"][number]) => {
    const vars = { ...(s.vars ?? {}) } as Record<string, string | number>;
    if (vars.side) vars.side = tt(`campus.side.${vars.side as "left" | "right"}`);
    return tt(`campus.steps.${s.key}`, vars);
  };

  return (
    <div className="pt-2 lg:pt-0">
      <PageHeader title={tt("campus.title")} subtitle={tt("campus.subtitle")} />
      <form method="get" action="/map" aria-label={tt("campus.form.aria")} className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="w-36"><Label htmlFor="m-room">{tt("campus.form.room")}</Label><Input id="m-room" name="room" defaultValue={room} placeholder={tt("campus.form.roomPlaceholder")} inputMode="numeric" maxLength={12} /></div>
        <div className="min-w-48 flex-1 sm:flex-none"><Label htmlFor="m-b">{tt("campus.form.building")}</Label>
          <Select id="m-b" name="b" defaultValue={code || "А"}>
            {CAMPUS_BUILDINGS.map((c) => { const bb = buildings.find((x) => x.code === c); return <option key={c} value={c}>{codes[c]} — {bb ? tr("buildings", bb.name) : c}</option>; })}
          </Select>
        </div>
        <Button type="submit"><Navigation className="h-4 w-4" aria-hidden />{tt("campus.form.go")}</Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <Card>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" tabIndex={0} role="region" aria-label={tt("campus.plan.aria")}>{route?.campus === "ODINTSOVO" ? <OdintsovoPlan active={route.known} codes={codes} l={l} /> : <MoscowPlan target={route?.target ?? null} codes={codes} l={l} />}</div>
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2" aria-label={tt("campus.buildings")}>
            {buildings.filter((x) => (route?.campus === "ODINTSOVO") === (x.campus === "ODINTSOVO")).map((x) => <li key={x.code}><b>{codes[x.code] ?? name(x.code)}</b> — {tr("buildings", x.name)}</li>)}
          </ul>
        </Card>
        <Card>
          {route ? (
            <>
              <CardTitle>{route.known && room ? tt("campus.route.title", { room }) : tt("campus.route.titleBuilding", { building: bInfo ? tr("buildings", bInfo.name) : code })}</CardTitle>
              {route.floor !== null && <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary dark:text-accent-text"><MapPin className="h-4 w-4" aria-hidden />{name(code)} · {tt("campus.route.floor", { n: route.floor })}</p>}
              <ol className="space-y-2.5 text-sm">
                {route.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg dark:bg-accent dark:text-[#14182a]">{i + 1}</span><span>{stepText(s)}</span></li>
                ))}
              </ol>
              {bInfo?.hint && <p className="mt-3 text-sm text-muted">{tr("hints", bInfo.hint)}</p>}
              {bInfo && <p className="mt-1 text-sm text-muted">{tr("addresses", bInfo.address)}</p>}
            </>
          ) : <p className="text-sm text-muted">{tt("campus.route.empty")}</p>}
        </Card>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-muted"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{tt("campus.disclaimer")}</p>
    </div>
  );
}
