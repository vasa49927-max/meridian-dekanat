import { describe, expect, it } from "vitest";
import { dayKey, fmt, msk, mskParts, relativeDay, startOfDay, startOfWeek, untilText } from "@/lib/time";

describe("московское время", () => {
  it("полночь по Москве = 21:00 UTC предыдущего дня", () => {
    expect(msk(2026, 11, 6).toISOString()).toBe("2026-11-05T21:00:00.000Z");
  });
  it("день и неделя считаются по Москве, а не по UTC", () => {
    const lateUtc = new Date("2026-11-08T22:30:00Z"); // пн 01:30 МСК
    expect(mskParts(lateUtc).weekday).toBe(1);
    expect(dayKey(lateUtc)).toBe("2026-11-09");
    expect(startOfWeek(lateUtc).toISOString()).toBe(msk(2026, 11, 9).toISOString());
    expect(startOfDay(lateUtc).toISOString()).toBe("2026-11-08T21:00:00.000Z");
  });
  it("форматирование по-русски", () => {
    const d = msk(2026, 11, 6, 10, 40);
    expect(fmt.time(d)).toBe("10:40");
    expect(fmt.longDay(d)).toBe("Пятница, 6 ноября");
  });
  it("относительные дни", () => {
    const from = msk(2026, 11, 6, 9);
    expect(relativeDay(msk(2026, 11, 6, 18), from)).toBe("сегодня");
    expect(relativeDay(msk(2026, 11, 7, 9), from)).toBe("завтра");
    expect(relativeDay(msk(2026, 11, 9, 9), from)).toBe("в понедельник");
    expect(relativeDay(msk(2026, 11, 10, 9), from)).toBe("во вторник");
  });
  it("обратный отсчёт", () => {
    expect(untilText(25 * 60000)).toBe("25 мин");
    expect(untilText(130 * 60000)).toBe("2 ч 10 мин");
    expect(untilText(50 * 3600000)).toBe("2 дня");
  });
});
