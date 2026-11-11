/**
 * «Как пройти» (раунд 6, улучшение №5). СХЕМА ВЫМЫШЛЕННАЯ: корпуса, этажи и правила нумерации придуманы для концепта
 * и не описывают реальный кампус. Чистая функция без БД — покрыта unit-тестом (tests/unit/campus.test.ts).
 *
 * Правила нумерации (вымышленные):
 *  А  — 4 цифры: 1-я — этаж, 2-я — блок (0 — центральный, 1 — восточное крыло, 2+ — западное); нечётные номера слева.
 *  Б  — 3 цифры 4xx–5xx: 1-я — этаж; вход через переход на 2-м этаже главного корпуса.
 *  О  — Одинцово, 3 цифры: 1-я — этаж.
 *  ВУЦ, СК — отдельные входы.
 */
export type StepKey = "enterMain" | "floor1" | "liftA" | "center" | "east" | "west" | "side" | "toBridge" | "liftB" | "bus" | "enterO" | "liftO" | "vuc" | "sport" | "unknown";
export type Step = { key: StepKey; vars?: Record<string, string | number> };
export type Target = "A_center" | "A_east" | "A_west" | "B" | "VUC" | "SK" | "O";
export type Route = { building: string; campus: "MOSCOW" | "ODINTSOVO"; floor: number | null; target: Target | null; side: "left" | "right" | null; steps: Step[]; known: boolean };

export const CAMPUS_BUILDINGS = ["А", "Б", "ВУЦ", "СК", "О"] as const;

const sideOf = (n: number) => (n % 2 ? "left" : "right") as "left" | "right";

export function routeTo(roomRaw: string, buildingRaw: string): Route {
  const room = roomRaw.trim().replace(/^ауд\.?\s*/i, "");
  const b = buildingRaw.trim().toUpperCase().replace(/^A$/, "А").replace(/^B$/, "Б").replace(/^O$/, "О");
  if (b === "А" && /^[1-4]\d{3}$/.test(room)) {
    const floor = Number(room[0]);
    const block = Number(room[1]);
    const target: Target = block === 0 ? "A_center" : block === 1 ? "A_east" : "A_west";
    const side = sideOf(Number(room));
    return {
      building: b, campus: "MOSCOW", floor, target, side, known: true,
      steps: [
        { key: "enterMain" },
        floor === 1 ? { key: "floor1" } : { key: "liftA", vars: { floor } },
        { key: block === 0 ? "center" : block === 1 ? "east" : "west" },
        { key: "side", vars: { room, side } },
      ],
    };
  }
  if (b === "Б" && /^[45]\d{2}$/.test(room)) {
    const floor = Number(room[0]);
    const side = sideOf(Number(room));
    return { building: b, campus: "MOSCOW", floor, target: "B", side, known: true, steps: [{ key: "enterMain" }, { key: "toBridge" }, { key: "liftB", vars: { floor } }, { key: "side", vars: { room, side } }] };
  }
  if (b === "О" && /^[1-4]\d{2}$/.test(room)) {
    const floor = Number(room[0]);
    const side = sideOf(Number(room));
    return { building: b, campus: "ODINTSOVO", floor, target: "O", side, known: true, steps: [{ key: "bus" }, { key: "enterO" }, floor === 1 ? { key: "floor1" } : { key: "liftO", vars: { floor } }, { key: "side", vars: { room, side } }] };
  }
  if (b === "ВУЦ") return { building: b, campus: "MOSCOW", floor: null, target: "VUC", side: null, known: true, steps: [{ key: "vuc" }] };
  if (b === "СК") return { building: b, campus: "MOSCOW", floor: null, target: "SK", side: null, known: true, steps: [{ key: "enterMain" }, { key: "sport" }] };
  return { building: b, campus: b === "О" ? "ODINTSOVO" : "MOSCOW", floor: null, target: null, side: null, known: false, steps: [{ key: "unknown" }] };
}

/** Ссылка «Как пройти» из карточки занятия. */
export const mapHref = (room: string, buildingCode: string) => `/map?room=${encodeURIComponent(room)}&b=${encodeURIComponent(buildingCode)}`;
