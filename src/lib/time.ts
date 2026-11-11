/**
 * Время в кабинете — всегда московское (Europe/Moscow, UTC+3 без перехода на летнее время с 2014 г.).
 * Сервер на хостинге работает в UTC, поэтому все «сегодня/неделя» считаем через эти функции.
 */
export const TZ = "Europe/Moscow";
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** Текущее время. DEMO_NOW (только вне production) фиксирует «сейчас» для скриншотов и видео. */
export function now(): Date {
  const fixed = typeof process !== "undefined" ? process.env.DEMO_NOW : undefined;
  if (fixed && process.env.NODE_ENV !== "production") return new Date(fixed);
  return new Date();
}

/** Дата-время по московским «настенным часам». month: 1–12. */
export function msk(y: number, month: number, d: number, hh = 0, mm = 0): Date {
  return new Date(Date.UTC(y, month - 1, d, hh, mm) - MSK_OFFSET_MS);
}

/** Компоненты даты по Москве. weekday: 1 = пн … 7 = вс. */
export function mskParts(date: Date) {
  const s = new Date(date.getTime() + MSK_OFFSET_MS);
  const wd = s.getUTCDay();
  return {
    y: s.getUTCFullYear(), m: s.getUTCMonth() + 1, d: s.getUTCDate(),
    hh: s.getUTCHours(), mm: s.getUTCMinutes(), weekday: wd === 0 ? 7 : wd,
  };
}

export function startOfDay(date: Date): Date {
  const p = mskParts(date);
  return msk(p.y, p.m, p.d);
}
export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * DAY);
}
export function startOfWeek(date: Date): Date {
  const p = mskParts(date);
  return addDays(startOfDay(date), -(p.weekday - 1));
}
export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
/** Ключ дня YYYY-MM-DD по Москве (для URL и группировки). */
export function dayKey(date: Date): string {
  const p = mskParts(date);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
export function parseDayKey(key: string | undefined | null): Date | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const dt = msk(y, m, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, ...o });
const fTime = f({ hour: "2-digit", minute: "2-digit" });
const fDayMonth = f({ day: "numeric", month: "long" });
const fWeekday = f({ weekday: "long" });
const fWeekdayShort = f({ weekday: "short" });
const fFull = f({ day: "numeric", month: "long", year: "numeric" });

/**
 * Единый формат дат (правка капитана, раунд 3): всегда число и месяц полностью — «16 ноября».
 * День недели — только подписью: «16 ноября (пн)». Сокращения «нояб.» не используем.
 */
export const fmt = {
  time: (d: Date) => fTime.format(d),
  /** «16 ноября» */
  dayMonth: (d: Date) => fDayMonth.format(d),
  weekday: (d: Date) => fWeekday.format(d),
  weekdayShort: (d: Date) => fWeekdayShort.format(d),
  /** «16 ноября 2026 г.» */
  full: (d: Date) => fFull.format(d),
  /** «13 ноября, 07:15» */
  dateTime: (d: Date) => `${fDayMonth.format(d)}, ${fTime.format(d)}`,
  /** «Пятница, 6 ноября» — заголовки дней */
  longDay: (d: Date) => {
    const w = fWeekday.format(d);
    return `${w[0].toUpperCase()}${w.slice(1)}, ${fDayMonth.format(d)}`;
  },
  /** «16 ноября (пн)» */
  shortDay: (d: Date) => `${fDayMonth.format(d)} (${fWeekdayShort.format(d)})`,
};

/**
 * «сегодня», «завтра», «вчера», иначе дата «12 ноября».
 * Правка капитана (раунд 2): дни недели словами («во вторник») не используем — везде число, день недели — подписью ниже.
 */
export function relativeDay(target: Date, from: Date = now()): string {
  const diff = Math.round((startOfDay(target).getTime() - startOfDay(from).getTime()) / DAY);
  if (diff === 0) return "сегодня";
  if (diff === 1) return "завтра";
  if (diff === -1) return "вчера";
  return fDayMonth.format(target);
}

/** «сегодня»/«завтра» или null — для подписи рядом с датой. */
export function nearDay(target: Date, from: Date = now()): "сегодня" | "завтра" | null {
  const r = relativeDay(target, from);
  return r === "сегодня" || r === "завтра" ? r : null;
}

/** «через 25 мин», «через 2 ч 10 мин», «идёт ещё 40 мин». */
export function untilText(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60000));
  if (total < 60) return `${total} мин`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d} ${plural(d, "день", "дня", "дней")}`;
  }
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
