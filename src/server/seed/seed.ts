import "server-only";
import { sql } from "drizzle-orm";
import type { DB } from "@/server/db";
import * as s from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { buildDocument, newRequestNumber, newVerifyCode, type StudentForDoc } from "@/server/documents";
import { addDays, msk, mskParts, now as nowFn, startOfDay, startOfWeek } from "@/lib/time";
import {
  ANNOUNCEMENTS, BUILDINGS, CURRICULA, DEMO_STAFF, DEMO_STUDENTS, EXTRA_STUDENTS, FACULTIES, PROGRAMS, REQUEST_TYPES, SEMESTER, SLOTS, TEACHERS,
} from "./data";

/** Детерминированный генератор случайных чисел — одинаковые демо-данные при каждом сбросе. */
function rng(seed: number) {
  let x = seed;
  return () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
}

const HOLIDAYS = new Set(["2026-11-04"]);
const SEM_START = msk(2026, 9, 1);
const SEM_END = msk(2026, 12, 19, 23, 59);

/**
 * Полностью пересоздаёт демо-данные. Вызывается из CLI (npm run db:seed),
 * при первом старте контейнера и кнопкой «Сбросить демо-данные» в кабинете деканата.
 */
export async function seedDemo(db: DB, opts: { now?: Date; log?: (m: string) => void } = {}) {
  const NOW = opts.now ?? nowFn();
  const log = opts.log ?? (() => {});
  const rand = rng(20261106);

  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE TABLE attachments, appointments, slots, notifications, announcements, documents, request_events, requests, request_types,
      deadlines, final_grades, scores, assessments, lessons, course_offerings, disciplines, teachers, staff, students, groups, buildings,
      programs, faculties, rate_events, sessions, users RESTART IDENTITY CASCADE`);

    // ── Структура
    const fac = Object.fromEntries((await tx.insert(s.faculties).values(FACULTIES.map((f) => ({ ...f }))).returning()).map((f) => [f.code, f]));
    const prog = Object.fromEntries((await tx.insert(s.programs).values(PROGRAMS.map((p) => ({ code: p.code, name: p.name, facultyId: fac[p.faculty].id }))).returning()).map((p) => [p.name, p]));
    const bld = Object.fromEntries((await tx.insert(s.buildings).values(BUILDINGS.map((b) => ({ ...b }))).returning()).map((b) => [b.code, b]));
    const teacherRows = await tx.insert(s.teachers).values(TEACHERS.map((t) => ({ lastName: t.lastName, firstName: t.firstName, middleName: t.middleName, title: t.title, department: t.department }))).returning();
    const teach = Object.fromEntries(TEACHERS.map((t, i) => [t.key, teacherRows[i]]));
    const groupDefs = [
      { key: "МЭО 2.2", faculty: "МЭО", name: "2.2", course: 2, program: "Экономика" },
      { key: "МП 4.1", faculty: "МП", name: "4.1", course: 4, program: "Юриспруденция" },
      { key: "ФЛМК 1.3", faculty: "ФЛМК", name: "1.3", course: 1, program: "Лингвистика" },
    ];
    const grp: Record<string, typeof s.groups.$inferSelect> = {};
    for (const g of groupDefs) {
      [grp[g.key]] = await tx.insert(s.groups).values({ name: g.name, course: g.course, facultyId: fac[g.faculty].id, programId: prog[g.program].id }).returning();
    }
    log("структура");

    // ── Пользователи
    const staffUser = (await tx.insert(s.users).values({ login: DEMO_STAFF.login, passwordHash: await hashPassword(DEMO_STAFF.password), role: "STAFF" }).returning())[0];
    const [staffRow] = await tx.insert(s.staff).values({ userId: staffUser.id, lastName: DEMO_STAFF.lastName, firstName: DEMO_STAFF.firstName, middleName: DEMO_STAFF.middleName, position: DEMO_STAFF.position, office: DEMO_STAFF.office }).returning();

    type Stu = typeof s.students.$inferSelect & { groupKey: string; demo?: (typeof DEMO_STUDENTS)[number] };
    const studentsAll: Stu[] = [];
    for (const d of DEMO_STUDENTS) {
      const [u] = await tx.insert(s.users).values({ login: d.login, passwordHash: await hashPassword(d.password), role: "STUDENT" }).returning();
      const [st] = await tx.insert(s.students).values({
        userId: u.id, lastName: d.lastName, firstName: d.firstName, middleName: d.middleName, gender: d.gender, recordBook: d.recordBook,
        groupId: grp[d.group].id, subgroup: d.subgroup, email: `${d.login}@student.meridian.example`, basis: d.basis, enrollmentYear: d.enrollmentYear,
        militaryTraining: d.military, avatarHue: d.hue, languages: [...d.languages],
      }).returning();
      studentsAll.push({ ...st, groupKey: d.group, demo: d });
    }
    let n = 100;
    for (const e of EXTRA_STUDENTS) {
      n++;
      const login = `student${n}`;
      // Случайный пароль, нигде не публикуется: эти студенты нужны только для очереди деканата.
      const [u] = await tx.insert(s.users).values({ login, passwordHash: await hashPassword(`x-${n}-${Math.random()}`), role: "STUDENT" }).returning();
      const g = grp[e.group];
      const [st] = await tx.insert(s.students).values({
        userId: u.id, lastName: e.lastName, firstName: e.firstName, middleName: e.middleName, gender: e.gender, recordBook: `${e.group.split(" ")[0]}-${26 - g.course}-0${n}`,
        groupId: g.id, subgroup: n % 2 ? 1 : 2, email: `${login}@student.meridian.example`, basis: n % 3 ? "бюджет" : "договор", enrollmentYear: 2026 - g.course,
        militaryTraining: e.gender === "M" && g.course >= 3, avatarHue: Math.floor(rand() * 360), languages: [{ lang: "Английский", level: "B2" }],
      }).returning();
      studentsAll.push({ ...st, groupKey: e.group });
    }
    log("пользователи");

    // ── Дисциплины, расписание, БРС
    type LessonRow = typeof s.lessons.$inferInsert;
    const lessonRows: LessonRow[] = [];
    const assessmentByOffering: Record<string, (typeof s.assessments.$inferSelect)[]> = {};
    const offeringsByGroup: Record<string, { offering: typeof s.courseOfferings.$inferSelect; def: (typeof CURRICULA)[string][number] }[]> = {};

    for (const [groupKey, list] of Object.entries(CURRICULA)) {
      const g = grp[groupKey];
      offeringsByGroup[groupKey] = [];
      for (const d of list) {
        const [disc] = await tx.insert(s.disciplines).values({ name: d.name, shortName: d.short, credits: d.credits, control: d.control }).returning();
        const [off] = await tx.insert(s.courseOfferings).values({ groupId: g.id, disciplineId: disc.id, teacherId: teach[d.teacher].id, semester: SEMESTER }).returning();
        offeringsByGroup[groupKey].push({ offering: off, def: d });
        const pts: (typeof s.assessments.$inferInsert)[] = d.points.map(([title, max, due, kind], i) => ({
          offeringId: off.id, title, maxPoints: max, kind, sortOrder: i, dueAt: due ? msk(2026, due[0], due[1], 23, 59) : null,
        }));
        if (d.control !== "CREDIT") pts.push({ offeringId: off.id, title: d.control === "EXAM" ? "Экзамен" : "Дифференцированный зачёт", maxPoints: 40, kind: "FINAL", sortOrder: 99, dueAt: null });
        else pts.push({ offeringId: off.id, title: "Зачёт", maxPoints: 40, kind: "FINAL", sortOrder: 99, dueAt: null });
        assessmentByOffering[off.id] = await tx.insert(s.assessments).values(pts).returning();

        // Еженедельные занятия весь семестр
        for (let w = startOfWeek(SEM_START); w < SEM_END; w = addDays(w, 7)) {
          for (const slot of d.week) {
            const day = addDays(w, slot.day - 1);
            const p = mskParts(day);
            const key = `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
            if (day < startOfDay(SEM_START) || HOLIDAYS.has(key)) continue;
            const [sh, sm] = SLOTS[slot.slot][0].split(":").map(Number);
            const [eh, em] = SLOTS[slot.slot][1].split(":").map(Number);
            lessonRows.push({
              groupId: g.id, subgroup: slot.subgroup ?? null, offeringId: off.id, title: d.name, teacherId: teach[d.teacher].id, type: slot.type,
              startsAt: msk(p.y, p.m, p.d, sh, sm), endsAt: msk(p.y, p.m, p.d, eh, em), room: slot.room, buildingId: bld[slot.b].id,
            });
          }
        }
        // Сессия: консультация + экзамен/зачёт
        const idx = list.indexOf(d);
        if (d.control === "EXAM") {
          const examDay = addDays(msk(2026, 12, 22), idx * 4);
          const ep = mskParts(examDay);
          lessonRows.push({ groupId: g.id, offeringId: off.id, title: d.name, teacherId: teach[d.teacher].id, type: "CONSULTATION", startsAt: msk(ep.y, ep.m, ep.d - 1, 14, 30), endsAt: msk(ep.y, ep.m, ep.d - 1, 15, 50), room: d.week[0].room, buildingId: bld[d.week[0].b].id });
          lessonRows.push({ groupId: g.id, offeringId: off.id, title: d.name, teacherId: teach[d.teacher].id, type: "EXAM", startsAt: msk(ep.y, ep.m, ep.d, 10, 0), endsAt: msk(ep.y, ep.m, ep.d, 14, 0), room: d.week[0].room, buildingId: bld[d.week[0].b].id });
        } else {
          const cd = addDays(msk(2026, 12, 14), idx % 5);
          const cp = mskParts(cd);
          lessonRows.push({ groupId: g.id, subgroup: d.week[0].subgroup ?? null, offeringId: off.id, title: d.name, teacherId: teach[d.teacher].id, type: "CREDIT", startsAt: msk(cp.y, cp.m, cp.d, 16, 10), endsAt: msk(cp.y, cp.m, cp.d, 17, 30), room: d.week[0].room, buildingId: bld[d.week[0].b].id });
        }
      }
    }
    // ВУЦ: четверг, весь день, только для студентов военного учебного центра (подгруппа 9)
    for (let w = startOfWeek(SEM_START); w < SEM_END; w = addDays(w, 7)) {
      const p = mskParts(addDays(w, 3));
      lessonRows.push({ groupId: grp["МП 4.1"].id, subgroup: 9, title: "Военная подготовка (ВУЦ)", teacherId: teach.voronin.id, type: "MILITARY", startsAt: msk(p.y, p.m, p.d, 9, 0), endsAt: msk(p.y, p.m, p.d, 15, 50), room: "Плац / ауд. 12", buildingId: bld["ВУЦ"].id });
    }

    // Переносы и замены: каждую неделю от текущей до конца семестра — по группе.
    lessonRows.sort((a, b) => +a.startsAt - +b.startsAt);
    const changeNotes: { groupId: string; subgroup: number | null; lesson: LessonRow; text: string; notifyAt: Date }[] = [];
    for (const g of Object.values(grp)) {
      for (let w = startOfWeek(NOW), wi = 0; w < SEM_END; w = addDays(w, 7), wi++) {
        const inWeek = lessonRows.filter((l) => l.groupId === g.id && l.type !== "MILITARY" && l.startsAt >= w && l.startsAt < addDays(w, 7) && l.status === undefined);
        if (inWeek.length < 4) continue;
        // 1) перенос на другой день и время
        const mv = inWeek[(wi * 3 + 2) % inWeek.length];
        const op = mskParts(addDays(mv.startsAt as Date, 1));
        const newStart = msk(op.y, op.m, op.d, 17, 40);
        if (op.weekday <= 6) {
          Object.assign(mv, { status: "MOVED", prevStartsAt: mv.startsAt, prevRoom: mv.room, startsAt: newStart, endsAt: new Date(+newStart + 80 * 60000), room: "1018", buildingId: bld["А"].id, changeNote: "Перенос по просьбе преподавателя (научная конференция)", changedAt: addDays(mv.startsAt as Date, -4) });
          changeNotes.push({ groupId: g.id, subgroup: mv.subgroup ?? null, lesson: mv, text: "перенос", notifyAt: addDays(mv.prevStartsAt as Date, -4) });
        }
        // 2) замена аудитории
        const rm = inWeek[(wi * 5 + 4) % inWeek.length];
        if (rm !== mv) {
          Object.assign(rm, { status: "MOVED", prevStartsAt: rm.startsAt, prevRoom: rm.room, room: rm.room === "2001" ? "2110" : "2001", changeNote: "Замена аудитории", changedAt: addDays(rm.startsAt as Date, -1) });
          changeNotes.push({ groupId: g.id, subgroup: rm.subgroup ?? null, lesson: rm, text: "аудитория", notifyAt: addDays(rm.startsAt as Date, -1) });
        }
        // 3) отмена — раз в две недели
        if (wi % 2 === 1) {
          const cn = inWeek.find((l) => l !== mv && l !== rm && l.type === "LECTURE");
          if (cn) {
            Object.assign(cn, { status: "CANCELLED", changeNote: "Преподаватель на больничном, материал — в LMS.", changedAt: addDays(cn.startsAt as Date, -2) });
            changeNotes.push({ groupId: g.id, subgroup: cn.subgroup ?? null, lesson: cn, text: "отмена", notifyAt: addDays(cn.startsAt as Date, -2) });
          }
        }
      }
    }
    // Изменения на ближайшие 10 дней уже «объявлены» к моменту сида — их видно в баннере и в ленте.
    changeNotes.forEach((c, i) => {
      const orig = (c.lesson.prevStartsAt ?? c.lesson.startsAt) as Date;
      if (c.notifyAt > NOW && +orig < +NOW + 10 * 86400000) {
        c.notifyAt = new Date(+NOW - (2 + (i % 5) * 7) * 3600 * 1000);
        c.lesson.changedAt = c.notifyAt;
      }
    });
    for (let i = 0; i < lessonRows.length; i += 500) await tx.insert(s.lessons).values(lessonRows.slice(i, i + 500));
    log(`расписание: ${lessonRows.length} занятий`);

    // Баллы
    const scoreRows: (typeof s.scores.$inferInsert)[] = [];
    for (const st of studentsAll) {
      for (const { offering, def } of offeringsByGroup[st.groupKey]) {
        if (def.week.every((w) => w.subgroup && w.subgroup !== st.subgroup)) continue; // чужая языковая подгруппа
        const asm = assessmentByOffering[offering.id].filter((a) => a.kind !== "FINAL");
        const preset = st.demo?.scores[def.key];
        asm.forEach((a, i) => {
          let pts: number | null = preset ? (preset[i] ?? null) : null;
          if (!preset && a.dueAt && a.dueAt < NOW && a.kind === "CONTROL") pts = Math.round(a.maxPoints * (0.5 + rand() * 0.5));
          if (pts !== null) scoreRows.push({ studentId: st.id, assessmentId: a.id, points: pts, gradedAt: a.dueAt ? addDays(a.dueAt, 3) : NOW });
        });
      }
    }
    if (scoreRows.length) await tx.insert(s.scores).values(scoreRows);
    // Зачётка прошлых семестров
    const fg = DEMO_STUDENTS.flatMap((d) => d.past.flatMap(([sem, list]) => list.map(([name, control, points, credits]) => ({
      studentId: studentsAll.find((x) => x.demo?.login === d.login)!.id, disciplineName: name, semester: sem, control, points, credits,
    }))));
    if (fg.length) await tx.insert(s.finalGrades).values(fg);
    log("баллы");

    // ── Сроки (часть — относительно «сейчас», чтобы демо было свежим в любой день проверки)
    const day = (n: number, hh = 23, mm = 59) => { const p = mskParts(addDays(NOW, n)); return msk(p.y, p.m, p.d, hh, mm); };
    await tx.insert(s.deadlines).values([
      { title: "Запись на курсы по выбору (весна)", description: "Учебный офис · после срока — только заявлением", dueAt: msk(2026, 11, 15, 23, 59) },
      { title: "Заявки на зимние стажировки", description: "Нужна выписка из зачётки — закажите заранее", dueAt: msk(2026, 11, 20, 23, 59), facultyId: fac["МЭО"].id, link: "/requests/new/RECORD_EXTRACT" },
      { title: "Справка для военкомата (ежегодно)", description: "Для студентов ВУЦ и состоящих на учёте", dueAt: msk(2026, 11, 30, 18, 0), facultyId: fac["МП"].id, link: "/requests/new/MILITARY_CERT" },
      { title: "Регистрация на модель ООН", description: "Студсовет", dueAt: msk(2026, 12, 1, 23, 59) },
      { title: "Эссе по МФР — загрузить в LMS", description: "Семинар доц. Ковалёвой М. Р.", dueAt: day(0), groupId: grp["МЭО 2.2"].id },
      { title: "Мини-тест по статистике", description: "Онлайн, 20 минут, в LMS", dueAt: day(3, 18, 0), groupId: grp["МЭО 2.2"].id },
      { title: "Тема ВКР — согласовать с руководителем", description: "Подписанный бланк — в студенческий офис", dueAt: day(5, 17, 0), groupId: grp["МП 4.1"].id },
      { title: "Эссе по введению в языкознание", description: "1500–2000 слов, загрузить в LMS", dueAt: day(1), groupId: grp["ФЛМК 1.3"].id },
      { title: "Продление полиса ДМС для иностранных студентов", description: "Международный отдел, ауд. 105 (Одинцово)", dueAt: day(9, 17, 0), facultyId: fac["ФЛМК"].id },
    ]);

    // ── Каталог заявок
    const rtypes = Object.fromEntries((await tx.insert(s.requestTypes).values(REQUEST_TYPES.map((r) => ({ ...r, popular: r.popular ?? false }))).returning()).map((r) => [r.code, r]));

    const docStudent = (st: Stu): StudentForDoc => {
      const g = Object.values(grp).find((x) => x.id === st.groupId)!;
      const f = Object.values(fac).find((x) => x.id === g.facultyId)!;
      const p = Object.values(prog).find((x) => x.id === g.programId)!;
      return { lastName: st.lastName, firstName: st.firstName, middleName: st.middleName, gender: st.gender, course: g.course, facultyName: f.name, programCode: p.code, programName: p.name, basis: st.basis, enrollmentYear: st.enrollmentYear, recordBook: st.recordBook };
    };
    const hoursAgo = (h: number) => new Date(+NOW - h * 3600 * 1000);
    type Ev = [status: (typeof s.requestStatusEnum.enumValues)[number], hoursAgo: number, comment?: string];
    const notifRows: (typeof s.notifications.$inferInsert)[] = [];
    const statusText: Record<string, string> = { SUBMITTED: "подана", IN_PROGRESS: "в работе", NEEDS_INFO: "нужно дополнить", READY: "готова", ISSUED: "выдана", REJECTED: "отклонена" };

    async function addRequest(st: Stu, code: string, payload: Record<string, string>, events: Ev[], comment?: string) {
      const t = rtypes[code];
      const created = hoursAgo(events[0][1]);
      const last = events[events.length - 1];
      const [r] = await tx.insert(s.requests).values({
        number: newRequestNumber(), studentId: st.id, typeId: t.id, status: last[0], payload, studentComment: comment ?? null,
        staffComment: last[2] ?? null, assigneeStaffId: events.length > 1 ? staffRow.id : null,
        dueAt: addDays(created, t.slaDays), createdAt: created, updatedAt: hoursAgo(last[1]),
      }).returning();
      await tx.insert(s.requestEvents).values(events.map(([status, h, c], i) => ({ requestId: r.id, status, comment: c ?? null, actor: i === 0 ? "Студент" : `${DEMO_STAFF.lastName} И. П., студенческий офис`, createdAt: hoursAgo(h) })));
      if (["READY", "ISSUED"].includes(last[0]) && t.producesDocument) {
        const doc = buildDocument(code, docStudent(st), payload);
        if (doc) await tx.insert(s.documents).values({ requestId: r.id, studentId: st.id, verifyCode: newVerifyCode(), title: doc.title, body: doc.body, issuedAt: hoursAgo(last[1]), validUntil: addDays(hoursAgo(last[1]), 90) });
      }
      if (st.demo) {
        for (const [status, h, c] of events.slice(1)) {
          notifRows.push({ userId: st.userId, kind: "REQUEST", title: `${t.title}: ${statusText[status]}`, body: c ?? (status === "READY" ? "Документ готов — откройте его в заявке, там же QR-код для проверки." : "Статус заявки обновлён."), link: `/requests/${r.id}`, important: status === "READY" || status === "NEEDS_INFO", createdAt: hoursAgo(h), readAt: h > 72 ? hoursAgo(h - 1) : null });
        }
      }
      return r;
    }
    const [anna, timur, mei] = studentsAll;
    await addRequest(anna, "STUDY_CERT_EN", { country: "Испания", purpose: "Стажировка", dates: "С 11.01.2027 по 05.02.2027" }, [["SUBMITTED", 30], ["IN_PROGRESS", 20, "Взяла в работу, будет готова к концу недели."]]);
    await addRequest(anna, "STUDY_CERT", { purpose: "ПАО «Условный банк» — для оформления карты", copies: "1" }, [["SUBMITTED", 480], ["IN_PROGRESS", 470], ["READY", 460], ["ISSUED", 300]]);
    const transfer = await addRequest(anna, "CREDIT_TRANSFER", { discipline: "Экономическая история", source: "Летняя школа другого вуза, 36 часов, оценка «отлично»" }, [["SUBMITTED", 900], ["IN_PROGRESS", 880], ["REJECTED", 850, "Объём курса (36 ч) меньше требуемого по учебному плану (72 ч). Можно подать повторно с курсом большего объёма."]]);
    const pdf = demoPdf("Summer school certificate (fictional, Meridian demo)");
    await tx.insert(s.attachments).values({ requestId: transfer.id, uploaderRole: "STUDENT", fileName: "Сертификат летней школы.pdf", mime: "application/pdf", size: pdf.length, data: pdf, createdAt: hoursAgo(900) });
    await addRequest(timur, "MILITARY_CERT", { commissariat: "Военный комиссариат Гагаринского района г. Москвы" }, [["SUBMITTED", 52], ["IN_PROGRESS", 40], ["READY", 5, "Справка готова в электронном виде. Бумажный экземпляр с печатью — в студенческом офисе, ауд. 1012."]]);
    await addRequest(timur, "STIPEND_CERT", { period: "Календарный год", purpose: "ИФНС — налоговый вычет" }, [["SUBMITTED", 3]]);
    await addRequest(timur, "INDIVIDUAL_PLAN", { reason: "Стажировка / работа по профилю", period: "С 01.12.2026 по 28.02.2027", details: "Стажировка в юридической фирме (вымышленной), 3 дня в неделю. Контрольные точки сдаю по графику." }, [["SUBMITTED", 70], ["NEEDS_INFO", 26, "Приложите письмо-подтверждение от работодателя с графиком стажировки — ответьте в комментарии к заявке."]]);
    await addRequest(mei, "STUDY_CERT_EN", { country: "Китай", purpose: "Виза", dates: "С 28.12.2026 по 12.01.2027" }, [["SUBMITTED", 6]], "Нужна к 20 ноября, пожалуйста");
    await addRequest(mei, "STUDENT_ID_DUP", { reason: "Испорчен" }, [["SUBMITTED", 300], ["IN_PROGRESS", 290], ["ISSUED", 200, "Дубликат выдан."]]);
    // Очередь деканата: заявки однокурсников
    const extras = studentsAll.slice(3);
    const plan: [string, Record<string, string>, Ev[]][] = [
      ["STUDY_CERT", { purpose: "Работодатель", copies: "2" }, [["SUBMITTED", 2]]],
      ["MILITARY_CERT", { commissariat: "Военный комиссариат Ломоносовского района г. Москвы" }, [["SUBMITTED", 28]]],
      ["RECORD_EXTRACT", { language: "Английский", purpose: "Стажировка в международной организации" }, [["SUBMITTED", 50], ["IN_PROGRESS", 30]]],
      ["RETAKE", { discipline: "Статистика", reason: "Совпадение даты экзамена с международной олимпиадой" }, [["SUBMITTED", 75]]],
      ["STUDY_CERT_EN", { country: "Франция", purpose: "Программа обмена", dates: "Весенний семестр 2027" }, [["SUBMITTED", 98]]],
      ["STUDY_CERT", { purpose: "Соцзащита", copies: "1" }, [["SUBMITTED", 120], ["IN_PROGRESS", 100], ["READY", 80]]],
      ["STIPEND_CERT", { period: "Последние 6 месяцев", purpose: "По месту требования" }, [["SUBMITTED", 10]]],
      ["INDIVIDUAL_PLAN", { reason: "Спортивные сборы", period: "С 15.11.2026 по 30.11.2026", details: "Сборы сборной по плаванию" }, [["SUBMITTED", 140]]],
      ["MILITARY_CERT", { commissariat: "Военный комиссариат г. Одинцово" }, [["SUBMITTED", 160], ["IN_PROGRESS", 150]]],
      ["STUDENT_ID_DUP", { reason: "Утерян" }, [["SUBMITTED", 20]]],
    ];
    for (const [i, [code, payload, ev]] of plan.entries()) await addRequest(extras[i % extras.length], code, payload, ev);
    log("заявки");

    // ── Объявления → уведомления адресатам
    for (const a of ANNOUNCEMENTS) {
      const [row] = await tx.insert(s.announcements).values({
        title: a.title, body: a.body, source: a.source, important: a.important, audience: a.audience,
        facultyId: a.faculty ? fac[a.faculty].id : null, course: a.course ?? null, groupId: a.group ? grp[a.group].id : null,
        authorStaffId: staffRow.id, publishedAt: hoursAgo(a.daysAgo * 24 + 3),
      }).returning();
      for (const st of studentsAll) {
        const g = Object.values(grp).find((x) => x.id === st.groupId)!;
        const match = a.audience === "ALL" || (a.audience === "FACULTY" && g.facultyId === row.facultyId) || (a.audience === "COURSE" && g.facultyId === row.facultyId && g.course === row.course) || (a.audience === "GROUP" && g.id === row.groupId);
        if (match) notifRows.push({ userId: st.userId, kind: "ANNOUNCEMENT", title: a.title, body: a.body, link: `/notifications?a=${row.id}`, important: a.important, createdAt: row.publishedAt, readAt: a.daysAgo > 3 ? hoursAgo(a.daysAgo * 24 - 5) : null });
      }
    }
    // ── Уведомления об изменениях расписания (у будущих — время появления в будущем: лента показывает только createdAt ≤ сейчас)
    for (const c of changeNotes) {
      const l = c.lesson;
      for (const st of studentsAll.filter((x) => x.groupId === c.groupId && (c.subgroup === null || c.subgroup === x.subgroup))) {
        const when = `${new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(l.prevStartsAt ?? l.startsAt)}`;
        const title = c.text === "отмена" ? `Отмена: ${l.title}` : c.text === "аудитория" ? `Новая аудитория: ${l.title}` : `Перенос: ${l.title}`;
        const body = c.text === "отмена" ? `${when} — занятие отменено. ${l.changeNote ?? ""}` : c.text === "аудитория" ? `${when}: ауд. ${l.prevRoom} → ауд. ${l.room}` : `Было: ${when}, ауд. ${l.prevRoom}. Стало: ${new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(l.startsAt)}, ауд. ${l.room}.`;
        notifRows.push({ userId: st.userId, kind: "SCHEDULE", title, body, link: `/schedule?d=${dayKeyOf(l.startsAt as Date)}`, important: true, createdAt: c.notifyAt, readAt: +c.notifyAt < +NOW - 3 * 86400000 ? c.notifyAt : null });
      }
    }
    // ── Напоминания о контрольных точках за 2 дня
    for (const [groupKey, list] of Object.entries(offeringsByGroup)) {
      for (const { offering, def } of list) {
        for (const a of assessmentByOffering[offering.id].filter((x) => x.kind === "CONTROL" && x.dueAt && x.dueAt > addDays(NOW, -7))) {
          for (const st of studentsAll.filter((x) => x.groupKey === groupKey && !def.week.every((w) => w.subgroup && w.subgroup !== x.subgroup))) {
            notifRows.push({ userId: st.userId, kind: "DEADLINE", title: `Через 2 дня: ${a.title} — ${def.short}`, body: `${def.name}. Максимум ${a.maxPoints} баллов. Срок — ${new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "long" }).format(a.dueAt!)}.`, link: "/grades", important: false, createdAt: addDays(a.dueAt!, -2) });
          }
        }
      }
    }
    for (let i = 0; i < notifRows.length; i += 500) await tx.insert(s.notifications).values(notifRows.slice(i, i + 500));
    log(`уведомления: ${notifRows.length}`);

    // ── Приём методиста: вт и чт 14:00–17:00 по 20 минут, две недели вперёд
    const slotRows: (typeof s.slots.$inferInsert)[] = [];
    for (let d = 0; d < 21; d++) {
      const dd = addDays(startOfDay(NOW), d);
      const p = mskParts(dd);
      if (p.weekday !== 2 && p.weekday !== 4) continue;
      for (let m = 14 * 60; m < 17 * 60; m += 20) slotRows.push({ staffId: staffRow.id, startsAt: msk(p.y, p.m, p.d, Math.floor(m / 60), m % 60), endsAt: msk(p.y, p.m, p.d, Math.floor((m + 20) / 60), (m + 20) % 60), location: DEMO_STAFF.office });
    }
    const slotsIns = slotRows.length ? await tx.insert(s.slots).values(slotRows).returning() : [];
    const future = slotsIns.filter((x) => x.startsAt > NOW);
    const bookings: [Stu, string, number][] = [[timur, "Оформление темы ВКР", 1], [extras[0], "Перевод на индивидуальный план", 2], [extras[3], "Академическая разница", 4], [extras[5], "Восстановление студенческого билета", 7]];
    for (const [st, topic, idx] of bookings) {
      const sl = future[idx];
      if (!sl) continue;
      await tx.update(s.slots).set({ isBooked: true }).where(sql`id = ${sl.id}`);
      await tx.insert(s.appointments).values({ slotId: sl.id, studentId: st.id, topic, createdAt: hoursAgo(20) });
    }
    log("запись к методисту");
  });
}

/** Крошечный валидный PDF для демо-вложения (текст латиницей, вымышленный). */
function demoPdf(text: string) {
  const content = `BT /F1 14 Tf 72 760 Td (${text}) Tj ET`;
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let out = "%PDF-1.4\n"; const offs: number[] = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

function dayKeyOf(d: Date) {
  const p = mskParts(d);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
