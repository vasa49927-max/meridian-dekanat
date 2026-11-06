import "server-only";
import { randomBytes, randomInt } from "node:crypto";

/** Код для публичной проверки по QR: 96 бит случайности, не связан с id в БД. */
export const newVerifyCode = () => randomBytes(12).toString("base64url");
export const newRequestNumber = () => `З-26-${String(randomInt(10000, 99999))}`;

export type StudentForDoc = {
  lastName: string; firstName: string; middleName: string | null; gender: "F" | "M"; course: number;
  facultyName: string; programCode: string; programName: string; basis: string; enrollmentYear: number; recordBook: string;
};

const fio = (s: StudentForDoc) => [s.lastName, s.firstName, s.middleName].filter(Boolean).join(" ");

// Родительный/дательный падеж для вымышленных ФИО из сида — упрощённо, чтобы справка читалась по-русски.
function dativeFio(s: StudentForDoc) {
  const ln = s.lastName, fn = s.firstName, mn = s.middleName;
  if (s.gender === "F") {
    const l = ln.endsWith("ова") || ln.endsWith("ева") || ln.endsWith("ина") ? ln.slice(0, -1) + "ой" : ln;
    const f = fn.endsWith("я") ? fn.slice(0, -1) + "е" : fn.endsWith("а") ? fn.slice(0, -1) + "е" : fn;
    const m = mn ? mn.slice(0, -1) + "е" : null;
    return [l, f, m].filter(Boolean).join(" ");
  }
  const l = /(ов|ев|ин)$/.test(ln) ? ln + "у" : ln;
  const f = fn.endsWith("й") ? fn.slice(0, -1) + "ю" : fn + "у";
  const m = mn ? mn + "у" : null;
  return [l, f, m].filter(Boolean).join(" ");
}

const ruFaculty = (name: string) => name.replace(/^Факультет/, "факультета").replace(/^Международно-правовой факультет/, "международно-правового факультета");

export function buildDocument(code: string, s: StudentForDoc, payload: Record<string, string>) {
  const student = s.gender === "F" ? "студенткой" : "студентом";
  const he = s.gender === "F" ? "она" : "он";
  const until = `31.08.${s.enrollmentYear + 4}`;
  const base = `${s.course} курса очной формы обучения ${ruFaculty(s.facultyName)} по направлению подготовки ${s.programCode} «${s.programName}», основа обучения — ${s.basis}.`;
  switch (code) {
    case "STUDY_CERT":
      return { title: "Справка об обучении", body: { purpose: payload.purpose || "по месту требования", lines: [
        `Настоящая справка выдана ${dativeFio(s)} в том, что ${he} действительно является ${student} ${base}`,
        `Период обучения: с 01.09.${s.enrollmentYear} по ${until} (нормативный срок).`,
        `Номер зачётной книжки: ${s.recordBook}.`,
        `Справка выдана для предоставления: ${payload.purpose || "по месту требования"}.`,
      ] } };
    case "STUDY_CERT_EN":
      return { title: "Certificate of Enrolment", body: { language: "en", purpose: payload.purpose, lines: [
        `This is to certify that ${translit(fio(s))} is a full-time ${ordinal(s.course)}-year student (${s.programCode} ${enProgram(s.programName)}).`,
        `Expected graduation: ${until}. Student ID: ${s.recordBook}.`,
        `Issued for: ${payload.purpose ?? "visa"}${payload.country ? `, ${payload.country}` : ""}${payload.dates ? `, travel dates ${payload.dates}` : ""}.`,
        "Concept prototype. This document is fictional and has no legal force.",
      ] } };
    case "MILITARY_CERT":
      return { title: "Справка для военного комиссариата (приложение № 4)", body: { purpose: payload.commissariat, lines: [
        `Дана ${dativeFio(s)} в том, что ${he} обучается на ${s.course} курсе по очной форме ${ruFaculty(s.facultyName)} по программе бакалавриата ${s.programCode} «${s.programName}».`,
        `Срок окончания обучения: ${until}. Образовательная организация имеет государственную аккредитацию.`,
        `Справка выдана для представления в ${payload.commissariat || "военный комиссариат"}.`,
      ] } };
    case "STIPEND_CERT":
      return { title: "Справка о размере стипендии", body: { purpose: payload.purpose, lines: [
        `Дана ${dativeFio(s)}, ${student} ${s.course} курса, в том, что за период «${payload.period ?? "последние 3 месяца"}» ${he} ${s.basis === "бюджет" ? "получал(а) государственную академическую стипендию в размере 4 200 ₽ в месяц (условная сумма для концепта)" : "стипендию не получал(а) — обучение на договорной основе"}.`,
        `Справка выдана для предоставления: ${payload.purpose || "по месту требования"}.`,
      ] } };
    case "RECORD_EXTRACT":
      return { title: payload.language === "Английский" ? "Transcript of Records" : "Выписка из зачётной книжки", body: { purpose: payload.purpose, lines: [
        `${fio(s)}, ${s.course} курс, ${s.programCode} «${s.programName}», зачётная книжка ${s.recordBook}.`,
        "Оценки за завершённые семестры приведены в разделе «Успеваемость → Зачётка» и зафиксированы на дату выдачи.",
      ] } };
    default:
      return null;
  }
}

function ordinal(n: number) { return ["first", "second", "third", "fourth", "fifth", "sixth"][n - 1] ?? `${n}th`; }
function enProgram(name: string) {
  return ({ "Экономика": "Economics", "Юриспруденция": "Law", "Лингвистика": "Linguistics" } as Record<string, string>)[name] ?? name;
}
const TR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
export function translit(s: string) {
  return s.split("").map((c) => {
    const l = c.toLowerCase(); const t = TR[l];
    if (t === undefined) return c;
    return c === l ? t : t.charAt(0).toUpperCase() + t.slice(1);
  }).join("");
}

/** Маскированное ФИО для публичной страницы проверки: «Соколова А. В.» — минимум персональных данных. */
export function maskedName(lastName: string, firstName: string, middleName: string | null) {
  return `${lastName} ${firstName[0]}.${middleName ? ` ${middleName[0]}.` : ""}`;
}
