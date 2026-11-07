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
    expect(relativeDay(msk(2026, 11, 9, 9), from)).toBe("9 ноября");
    expect(relativeDay(msk(2026, 11, 10, 9), from)).toBe("10 ноября");
  });
  it("обратный отсчёт", () => {
    expect(untilText(25 * 60000)).toBe("25 мин");
    expect(untilText(130 * 60000)).toBe("2 ч 10 мин");
    expect(untilText(50 * 3600000)).toBe("2 дня");
  });
});

import { deviceLabel } from "@/lib/device";
describe("deviceLabel", () => {
  it("человеческое имя устройства вместо строки User-Agent", () => {
    expect(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36")).toBe("Chrome · Windows");
    expect(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe("Safari · iPhone/iPad");
    expect(deviceLabel("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 YaBrowser/25.8 Mobile Safari/537.36")).toBe("Яндекс Браузер · Android");
    expect(deviceLabel(null)).toBe("Неизвестное устройство");
  });
});
