/**
 * Раунд 6: маршруты «Как пройти», изоляция портфолио, анонимность опроса, риски, панель руководителя, ИИ-черновик.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { db, schema as t } from "@/server/db";
import { seedDemo } from "@/server/seed/seed";
import type { StaffViewer, StudentViewer } from "@/server/auth/guards";
import { routeTo } from "@/lib/campus";
import { addMyPortfolioItem, deleteMyPortfolioItem, listMyPortfolio } from "@/server/dal/portfolio";
import { listMySurveyCourses, staffSurveyResults, submitMySurvey } from "@/server/dal/survey";
import { listMyRiskInvites, staffInviteAtRisk, staffRiskList } from "@/server/dal/risks";
import { staffAnalytics } from "@/server/dal/analytics";
import { draftReply } from "@/server/ai/draft";

const NOW = new Date("2026-11-13T07:15:00Z");
async function student(login: string): Promise<StudentViewer> {
  const [r] = await db.select({ userId: t.users.id, s: t.students, g: t.groups }).from(t.users)
    .innerJoin(t.students, eq(t.students.userId, t.users.id)).innerJoin(t.groups, eq(t.groups.id, t.students.groupId)).where(eq(t.users.login, login));
  return { role: "STUDENT", userId: r.userId, studentId: r.s.id, groupId: r.s.groupId, subgroup: r.s.subgroup, militaryTraining: r.s.militaryTraining, facultyId: r.g.facultyId, course: r.g.course, avatarHue: r.s.avatarHue, firstName: r.s.firstName, lastName: r.s.lastName, middleName: r.s.middleName };
}
async function staffV(): Promise<StaffViewer> {
  const [r] = await db.select({ userId: t.users.id, s: t.staff }).from(t.users).innerJoin(t.staff, eq(t.staff.userId, t.users.id)).where(eq(t.users.login, "belova"));
  return { role: "STAFF", userId: r.userId, staffId: r.s.id, firstName: r.s.firstName, lastName: r.s.lastName, middleName: r.s.middleName, position: r.s.position };
}

let anna: StudentViewer, timur: StudentViewer, mei: StudentViewer, staff: StaffViewer;
beforeAll(async () => {
  await seedDemo(db, { now: NOW });
  [anna, timur, mei, staff] = await Promise.all([student("sokolova"), student("galiev"), student("lin"), staffV()]);
}, 60_000);
afterAll(async () => { await seedDemo(db, { now: NOW }); });

describe("«Как пройти» (вымышленная схема)", () => {
  it("главный корпус: этаж, блок, сторона коридора", () => {
    const r = routeTo("3015", "А");
    expect(r).toMatchObject({ known: true, floor: 3, target: "A_center", side: "left" });
    expect(r.steps.map((s) => s.key)).toEqual(["enterMain", "liftA", "center", "side"]);
    expect(routeTo("2110", "А")).toMatchObject({ target: "A_east", side: "right" });
    expect(routeTo("1018", "А").steps[1].key).toBe("floor1");
  });
  it("корпус Б — через переход, Одинцово — автобус", () => {
    expect(routeTo("412", "Б").steps.map((s) => s.key)).toEqual(["enterMain", "toBridge", "liftB", "side"]);
    expect(routeTo("214", "О")).toMatchObject({ campus: "ODINTSOVO", floor: 2, target: "O" });
    expect(routeTo("ауд. 506", "B")).toMatchObject({ building: "Б", floor: 5 }); // латиница и «ауд.»
  });
  it("неизвестная аудитория — честное «нет на схеме»", () => {
    expect(routeTo("99999", "А")).toMatchObject({ known: false, steps: [{ key: "unknown" }] });
  });
});

describe("Портфолио: только своё", () => {
  it("список — только свои записи", async () => {
    const mine = await listMyPortfolio(anna);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((i) => i.studentId === anna.studentId)).toBe(true);
  });
  it("новая запись не может быть «подтверждённой»", async () => {
    expect(await addMyPortfolioItem(timur, { kind: "CERTIFICATE", title: "Тестовый сертификат", date: "2026-09" })).toEqual({ ok: true });
    const [it] = await db.select().from(t.portfolioItems).where(and(eq(t.portfolioItems.studentId, timur.studentId), eq(t.portfolioItems.title, "Тестовый сертификат")));
    expect(it.verified).toBe(false);
  });
  it("чужую запись удалить нельзя, свою подтверждённую — тоже", async () => {
    const annaItems = await listMyPortfolio(anna);
    const own = annaItems.find((i) => !i.verified)!;
    const verified = annaItems.find((i) => i.verified)!;
    expect(await deleteMyPortfolioItem(timur, own.id)).toBe(false);
    expect(await deleteMyPortfolioItem(anna, verified.id)).toBe(false);
    expect(await deleteMyPortfolioItem(anna, own.id)).toBe(true);
    expect(await deleteMyPortfolioItem(anna, "not-a-uuid")).toBe(false);
  });
});

describe("Опрос о курсах: анонимность", () => {
  it("в таблице ответов нет связи со студентом и точного времени", () => {
    const cols = Object.keys(t.surveyResponses);
    expect(cols).not.toContain("studentId");
    expect(cols).not.toContain("createdAt");
  });
  it("ответить можно один раз; чужой курс — не найден", async () => {
    const [course] = await listMySurveyCourses(anna);
    const vote = { offeringId: course.id, clarity: 4, teacher: 5, workload: 3 };
    expect(await submitMySurvey(anna, vote)).toEqual({ ok: true });
    expect(await submitMySurvey(anna, vote)).toMatchObject({ ok: false, error: "already" });
    expect((await listMySurveyCourses(anna)).find((c) => c.id === course.id)?.voted).toBe(true);
    expect(await submitMySurvey(mei, vote)).toMatchObject({ ok: false, error: "notFound" });
    const [row] = await db.select().from(t.surveyResponses).where(eq(t.surveyResponses.offeringId, course.id)).orderBy(t.surveyResponses.day).limit(1);
    expect(row.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("деканат не видит итоги курса, пока ответов меньше трёх", async () => {
    const res = await staffSurveyResults(staff);
    for (const r of res) {
      if (r.n < 3) expect(r).toMatchObject({ shown: false, clarity: null, comments: [] });
      else expect(r.clarity).not.toBeNull();
    }
    expect(res.some((r) => r.shown)).toBe(true);
  });
});

describe("Риски и приглашение на консультацию", () => {
  it("тот же расчёт БРС, что у студента; в списке есть демо-студенты с риском", async () => {
    const list = await staffRiskList(staff);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((r) => r.summary.risk !== "none")).toBe(true);
    expect(list.some((r) => r.name.startsWith("Соколова") && r.discipline === "Статистика")).toBe(true);
  });
  it("приглашение: уведомление студенту, повтор в течение недели запрещён", async () => {
    const row = (await staffRiskList(staff)).find((r) => r.name.startsWith("Соколова"))!;
    expect(await staffInviteAtRisk(staff, row.studentId, row.offeringId)).toEqual({ ok: true });
    expect(await staffInviteAtRisk(staff, row.studentId, row.offeringId)).toMatchObject({ ok: false });
    expect((await listMyRiskInvites(anna)).has(row.offeringId)).toBe(true);
    expect((await listMyRiskInvites(timur)).size).toBe(0);
    const [n] = await db.select().from(t.notifications).where(and(eq(t.notifications.userId, anna.userId), eq(t.notifications.link, "/appointments"), eq(t.notifications.kind, "GRADE")));
    expect(n.title).toContain("Статистика");
  });
  it("курс чужой группы студенту не назначить", async () => {
    const meiRow = (await staffRiskList(staff)).find((r) => r.name.startsWith("Лин"))!;
    expect(await staffInviteAtRisk(staff, anna.studentId, meiRow.offeringId)).toMatchObject({ ok: false });
  });
});

describe("Панель руководителя и ИИ-черновик", () => {
  it("агрегаты сходятся", async () => {
    const a = await staffAnalytics(staff, 30);
    expect(a.daysSeries).toHaveLength(30);
    expect(a.daysSeries.reduce((s, d) => s + d.n, 0)).toBe(a.kpi.received);
    expect(a.kpi.onTimePct === null || (a.kpi.onTimePct >= 0 && a.kpi.onTimePct <= 100)).toBe(true);
    expect(a.byStaff.length).toBe(2);
  });
  it("черновик без ключа GigaChat — шаблон с обращением и пометкой для методиста", async () => {
    const [r] = await db.select().from(t.requests).where(eq(t.requests.status, "SUBMITTED")).limit(1);
    const d = await draftReply(staff, r.id, "REJECTED");
    expect(d?.mode).toBe("offline");
    expect(d?.text).toMatch(/здравствуйте!/);
    expect(d?.text).toContain("[укажите причину]");
    expect(await draftReply(staff, "00000000-0000-0000-0000-000000000000", "READY")).toBeNull();
  });
});

describe("Раунд 7: совпадение номера заявки", () => {
  it("ошибка уникальности приходит с кодом 23505 в cause — по нему createMyRequest повторяет попытку", async () => {
    const [r] = await db.select().from(t.requests).limit(1);
    let err: unknown = null;
    try { await db.insert(t.requests).values({ ...r, id: undefined as unknown as string }); } catch (e) { err = e; }
    const pg = err as { code?: string; cause?: { code?: string } };
    expect(pg.code === "23505" || pg.cause?.code === "23505").toBe(true);
  });
});

describe("Раунд 8: курсы по выбору", () => {
  it("последнее место — одному, дальше лист ожидания; не больше двух курсов", async () => {
    const { chooseElective, listMyElectives } = await import("@/server/dal/electives");
    const [nego] = await db.select().from(t.electives).where(eq(t.electives.code, "NEGOEN"));
    const before = (await listMyElectives(anna)).items.find((e) => e.id === nego.id)!;
    expect(before.free).toBe(1);
    expect(await chooseElective(anna, nego.id)).toEqual({ ok: true, status: "ENROLLED" });
    expect(await chooseElective(anna, nego.id)).toEqual({ ok: false, error: "exists" });
    expect(await chooseElective(mei, nego.id)).toEqual({ ok: true, status: "WAITLIST" }); // мест больше нет
    const [media] = await db.select().from(t.electives).where(eq(t.electives.code, "MEDIA"));
    const [esg] = await db.select().from(t.electives).where(eq(t.electives.code, "ESG"));
    expect(await chooseElective(anna, media.id)).toEqual({ ok: true, status: "ENROLLED" });
    expect(await chooseElective(anna, esg.id)).toEqual({ ok: false, error: "limit" });
  });
  it("отказ освобождает место — первый в листе ожидания зачисляется и получает уведомление", async () => {
    const { dropElective, listMyElectives } = await import("@/server/dal/electives");
    const [nego] = await db.select().from(t.electives).where(eq(t.electives.code, "NEGOEN"));
    expect(await dropElective(anna, nego.id)).toEqual({ ok: true });
    const meiView = (await listMyElectives(mei)).items.find((e) => e.id === nego.id)!;
    expect(meiView.myStatus).toBe("ENROLLED");
    const [n] = await db.select().from(t.notifications).where(and(eq(t.notifications.userId, mei.userId), eq(t.notifications.link, "/grades/electives")));
    expect(n.title).toContain("Переговоры на английском");
    expect(await dropElective(timur, nego.id)).toEqual({ ok: false, error: "notChosen" }); // чужую запись не отменить
  });
  it("курс для старших — не для первокурсника; закрытое окно — запись невозможна", async () => {
    const { chooseElective } = await import("@/server/dal/electives");
    const [eaeu] = await db.select().from(t.electives).where(eq(t.electives.code, "EAEULAW")); // с 3 курса
    expect(await chooseElective(mei, eaeu.id)).toEqual({ ok: false, error: "course" });
    await db.update(t.electives).set({ closesAt: new Date("2026-11-01T00:00:00Z") }).where(eq(t.electives.code, "SPORTM"));
    const [sport] = await db.select().from(t.electives).where(eq(t.electives.code, "SPORTM"));
    expect(await chooseElective(timur, sport.id)).toEqual({ ok: false, error: "closed" });
  });
  it("одновременная запись на последнее место: зачислен ровно один", async () => {
    const { chooseElective } = await import("@/server/dal/electives");
    const [esg] = await db.select().from(t.electives).where(eq(t.electives.code, "ESG"));
    const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(t.electiveChoices).where(and(eq(t.electiveChoices.electiveId, esg.id), eq(t.electiveChoices.status, "ENROLLED")));
    await db.update(t.electives).set({ capacity: esg.reserved + n + 1 }).where(eq(t.electives.id, esg.id)); // ровно одно место
    // У Анны и Мэй по одному свободному «слоту» — пробуют занять одно место одновременно
    const res = await Promise.all([chooseElective(anna, esg.id), chooseElective(mei, esg.id)]);
    const statuses = res.filter((r) => r.ok).map((r) => (r as { status: string }).status);
    expect(statuses).toHaveLength(2);
    expect(statuses.filter((x) => x === "ENROLLED")).toHaveLength(1);
    expect(statuses.filter((x) => x === "WAITLIST")).toHaveLength(1);
  });
});

describe("Раунд 8: чек-лист первокурсника", () => {
  it("отметки — только свои и только из списка", async () => {
    const { listMyChecklist, toggleMyChecklist } = await import("@/server/dal/checklist");
    expect(await toggleMyChecklist(mei, "drop table", true)).toBe(false);
    expect(await toggleMyChecklist(mei, "library", true)).toBe(true);
    expect((await listMyChecklist(mei)).has("library")).toBe(true);
    expect((await listMyChecklist(anna)).has("library")).toBe(false);
    expect(await toggleMyChecklist(mei, "library", false)).toBe(true);
    expect((await listMyChecklist(mei)).has("library")).toBe(false);
  });
});

describe("Раунд 8: место в листе ожидания", () => {
  it("второй в очереди видит «2», а не «1» (точность времени записи)", async () => {
    const { listMyElectives, chooseElective, dropElective } = await import("@/server/dal/electives");
    const anna = await student("sokolova");
    for (const e of (await listMyElectives(anna)).items.filter((x) => x.myStatus)) await dropElective(anna, e.id); // предыдущие тесты могли записать Анну
    const full = (await listMyElectives(anna)).items.find((e) => e.free === 0 && e.waiting > 0)!;
    expect(await chooseElective(anna, full.id)).toMatchObject({ ok: true, status: "WAITLIST" });
    const mine = (await listMyElectives(anna)).items.find((e) => e.id === full.id)!;
    expect(mine.myPosition).toBe(full.waiting + 1);
  });
});
