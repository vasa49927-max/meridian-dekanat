import type { Locale } from "./config";
import { INTL_LOCALE } from "./config";

/**
 * Мини-i18n без зависимостей: словарь — вложенный объект строк; множественное число — объект
 * { one, few, many, other } по Intl.PluralRules; подстановки — {name}.
 */
export type PluralForms = { one?: string; two?: string; few?: string; many?: string; other: string };
type Leaf = string | PluralForms;
export type DictTree = { [k: string]: Leaf | DictTree };

/** Все пути-ключи словаря вида "today.next.title". */
export type Path<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | PluralForms ? `${P}${K}` : Path<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Та же форма словаря, но строки — любые (для переводов: все ключи обязательны). */
export type Shape<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends PluralForms ? PluralForms : Shape<T[K]> };

export type Vars = Record<string, string | number>;

function get(dict: DictTree, path: string): Leaf | undefined {
  let cur: unknown = dict;
  for (const p of path.split(".")) {
    if (cur && typeof cur === "object" && p in (cur as object)) cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return cur as Leaf | undefined;
}

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

export function makeT<D extends DictTree>(dict: D, fallback: DictTree, locale: Locale) {
  const rules = new Intl.PluralRules(INTL_LOCALE[locale]);
  const t = (key: Path<D>, vars?: Vars): string => {
    const v = get(dict, key) ?? get(fallback, key);
    if (typeof v === "string") return fill(v, vars);
    if (v && typeof v === "object" && "other" in v) return fill(v.other, vars);
    return key;
  };
  /** Множественное число: tn("x.days", 5) → «5 дней» / "5 days". В строке доступна подстановка {n}. */
  const tn = (key: Path<D>, n: number, vars?: Vars): string => {
    const v = get(dict, key) ?? get(fallback, key);
    if (typeof v === "string") return fill(v, { n, ...vars });
    if (!v || typeof v !== "object") return key;
    const forms = v as PluralForms;
    const form = forms[rules.select(n) as keyof PluralForms] ?? forms.other;
    return fill(form, { n, ...vars });
  };
  return { t, tn };
}

/** Перевод «данных» (названия предметов, корпусов, видов заявок…): словарь по русскому тексту, иначе — как есть. */
export function makeTr(data: Record<string, Record<string, string>>) {
  return (group: string, value: string | null | undefined): string => (value == null ? "" : data[group]?.[value] ?? value);
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
/** Транслитерация имён для нерусских интерфейсов (упрощённая, как в загранпаспорте). */
export function translit(s: string): string {
  return s.replace(/[А-Яа-яЁё]/g, (ch) => {
    const lo = ch.toLowerCase();
    const r = TRANSLIT[lo] ?? ch;
    return ch === lo ? r : r.charAt(0).toUpperCase() + r.slice(1);
  });
}
