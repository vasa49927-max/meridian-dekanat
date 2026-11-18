import { describe, expect, it } from "vitest";
import { BRS, markFor, neededOnFinal, stipendForecast, summarize, whatIf, type Control } from "@/lib/brs";

const a = (maxPoints: number, points: number | null, kind = "CONTROL") => ({ id: String(Math.random()), title: "t", maxPoints, points, kind });

describe("БРС", () => {
  it("шкала оценок по Положению", () => {
    expect(markFor(95).mark).toBe(5);
    expect(markFor(90).mark).toBe(5);
    expect(markFor(89.9).mark).toBe(4);
    expect(markFor(75).mark).toBe(4);
    expect(markFor(60).mark).toBe(3);
    expect(markFor(59).mark).toBe(2);
  });

  it("зачёт автоматом при 42+ в текущем контроле", () => {
    const s = summarize("CREDIT", [a(20, 18), a(20, 16), a(20, 9)]);
    expect(s.earned).toBe(43);
    expect(s.auto?.achieved).toBe(true);
  });

  it("считает, сколько не хватает до автомата и возможно ли это", () => {
    const s = summarize("CREDIT", [a(20, 15), a(20, 14), a(20, null)]);
    expect(s.auto?.need).toBe(13);
    expect(s.auto?.possible).toBe(true);
    const t = summarize("EXAM", [a(20, 10), a(20, 10), a(20, null)]);
    expect(t.auto?.kind).toBe("excellent");
    expect(t.auto?.need).toBe(34);
    expect(t.auto?.possible).toBe(false);
  });

  it("высокий риск, если 60 недостижимо даже с экзаменом", () => {
    const s = summarize("EXAM", [a(30, 5), a(30, 10)]);
    expect(s.risk).toBe("high");
  });

  it("риск «наблюдать» при низком темпе", () => {
    const s = summarize("EXAM", [a(15, 7), a(15, 8), a(30, null)]);
    expect(s.pacePct).toBe(50);
    expect(s.risk).toBe("watch");
  });

  it("итог с экзаменом", () => {
    const s = summarize("EXAM", [a(30, 25), a(30, 27), a(40, 35, "FINAL")]);
    expect(s.total).toBe(87);
  });

  it("сколько нужно на экзамене и «что, если»", () => {
    expect(neededOnFinal(48, 90)).toEqual({ need: 42, feasible: false });
    expect(neededOnFinal(48, 75)).toEqual({ need: 27, feasible: true });
    const w = whatIf(40, 10, 35);
    expect(w.current).toBe(50);
    expect(w.total).toBe(85);
    expect(w.mark.label).toBe("хорошо");
    expect(whatIf(55, 20, 50).total).toBe(BRS.currentMax + BRS.finalMax);
  });
});

import { planFor } from "@/lib/brs";
import { buildI18n } from "@/i18n";
import { DICTS } from "@/i18n/dict";
import { DATA } from "@/i18n/data";
import { planText } from "@/i18n/brs";
describe("«Что мне делать» по дисциплине", () => {
  it("автомат уже есть", () => {
    expect(planFor("CREDIT", summarize("CREDIT", [a(20, 18), a(20, 16), a(20, 9)])).tone).toBe("ok");
  });
  it("цель достижима — считает средний % за оставшиеся работы", () => {
    const p = planFor("EXAM", summarize("EXAM", [a(15, 14), a(15, 15), a(30, null)]));
    expect(p.tone).toBe("goal");
    expect(p.needPct).toBe(84); // нужно 25 из 30
  });
  it("только экзамен — подсказывает нужные баллы, не больше 40", () => {
    const sum = summarize("EXAM", [a(30, 20), a(30, null)]);
    const p = planFor("EXAM", sum);
    expect(p.tone).toBe("exam");
    expect(p.detail).toBe("examNeed");
    for (const [, n] of p.parts) expect(n).toBeLessThanOrEqual(40);
    // текст на русском и английском собирается из словаря
    const ru = buildI18n("ru", DICTS.ru, DICTS.ru, null), en = buildI18n("en", DICTS.en, DICTS.ru, DATA.en);
    expect(planText(p, sum, ru.t).detail).toMatch(/^Сколько нужно на экзамене \(из 40\) при нынешнем темпе: «(отлично|хорошо|удовл\.)» — ~[\d.]+/);
    expect(planText(p, sum, en.t).detail).toMatch(/^What you need on the exam \(of 40\)/);
  });
  it("высокий риск", () => {
    expect(planFor("EXAM", summarize("EXAM", [a(30, 5), a(30, 10)])).tone).toBe("risk");
  });
});

describe("прогноз стипендии (раунд 8)", () => {
  const mk = (control: Control, pts: (number | null)[]) => summarize(control, pts.map((p, i) => ({ id: String(i), title: `w${i}`, maxPoints: 15, points: p, kind: "CONTROL" })));
  it("договор — стипендия не назначается", () => {
    expect(stipendForecast("договор", [])).toMatchObject({ applicable: false, status: "none" });
  });
  it("все прогнозы ≥ 75 — сохранится; «удовл.» по экзамену — под угрозой с нужным баллом за экзамен", () => {
    const good = mk("EXAM", [14, 13, null, null]);
    const weak = mk("EXAM", [9, 10, null, null]); // 19 из 30 — «хорошо» ещё достижимо
    expect(stipendForecast("бюджет", [{ name: "A", short: "A", control: "EXAM", summary: good }]).status).toBe("keep");
    const f = stipendForecast("бюджет", [{ name: "A", short: "A", control: "EXAM", summary: good }, { name: "B", short: "B", control: "EXAM", summary: weak }]);
    expect(f.status).toBe("risk");
    expect(f.risks[0]).toMatchObject({ name: "B", feasible: true, kind: "exam" });
    expect(f.risks[0].predicted).toBeLessThan(75);
    expect(f.risks[0].need).toBeGreaterThan(0);
  });
  it("слабый темп: «хорошо» достижимо только если поднять темп в семестре", () => {
    const slow = mk("EXAM", [6, 7, null, null]); // 13 из 30, впереди ещё 30
    const r = stipendForecast("бюджет", [{ name: "S", short: "S", control: "EXAM", summary: slow }]).risks[0];
    expect(r).toMatchObject({ kind: "pace", need: 22, rem: 30 }); // 75 − 40 − 13
  });
  it("зачёт автоматом не создаёт риска", () => {
    const auto = mk("CREDIT", [15, 15, 14, null]);
    expect(stipendForecast("бюджет", [{ name: "C", short: "C", control: "CREDIT", summary: auto }]).status).toBe("keep");
  });
});
