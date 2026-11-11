import type { Locale } from "./config";
import { INTL_LOCALE } from "./config";

/**
 * Перевод «содержимого» (правка капитана, раунд 4): тексты из БД, которые написал деканат или собрала система, —
 * объявления, сроки, комментарии, уведомления о переносах и статусах.
 * 1) точное совпадение из словаря (демо-тексты); 2) шаблоны системных сообщений («Перенос: …», «Было: … Стало: …»);
 * 3) русские даты «18 ноября (ср)» и «ауд. 506» — в формат языка; 4) остальное — по предложениям из словаря.
 * Если перевода нет, текст остаётся на языке оригинала (так устроены реальные системы).
 */
type Lex = { exact: Record<string, string>; words: Record<string, string> };

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const STATUS_RU = { подана: "SUBMITTED", "в работе": "IN_PROGRESS", "нужно дополнить": "NEEDS_INFO", готова: "READY", выдана: "ISSUED", отклонена: "REJECTED" } as const;

export function makeContentTr(locale: Locale, lex: Lex | null, ctx: { tr: (g: string, v: string) => string; status: (s: keyof typeof REV) => string }) {
  if (locale === "ru" || !lex) return (s: string | null | undefined) => s ?? "";
  const W = lex.words;
  const L = INTL_LOCALE[locale];
  const dm = new Intl.DateTimeFormat(L, { day: "numeric", month: "long", timeZone: "UTC" });
  const wd = new Intl.DateTimeFormat(L, { weekday: "short", timeZone: "UTC" });
  const year = new Date().getUTCFullYear();
  const date = (d: string, m: string, withWd: boolean) => {
    const dt = new Date(Date.UTC(year, MONTHS.indexOf(m), Number(d)));
    return withWd ? (locale === "zh" ? `${dm.format(dt)}（${wd.format(dt)}）` : `${dm.format(dt)} (${wd.format(dt)})`) : dm.format(dt);
  };
  const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => lex.exact[x] ?? lex.exact[x.replace(/\.$/, "")] ?? x).join(" ");
  const generic = (s: string) => sentences(s)
    .replace(new RegExp(`(\\d{1,2}) (${MONTHS.join("|")})( \\((?:пн|вт|ср|чт|пт|сб|вс)\\))?`, "g"), (_, d, m, w) => date(d, m, !!w))
    .replace(/ауд\. ([0-9A-Za-zА-Яа-я][\w-]*)/g, (_, r) => W.room.replace("{r}", r))
    .replace(/^Было: /, `${W.was}: `).replace(/\. Стало: /, `. ${W.now}: `).replace(/ — занятие отменено\./, ` — ${W.cancelled}.`)
    .replace(/(\d+) (?:рабочий день|рабочих дня|рабочих дней)/, (_, n) => W.workdays.replace("{n}", n))
    .replace(/ · /g, " · ");
  return (s: string | null | undefined): string => {
    if (!s) return "";
    if (lex.exact[s]) return lex.exact[s];
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(.+): (подана|в работе|нужно дополнить|готова|выдана|отклонена)$/))) {
      const st = ctx.status(STATUS_RU[m[2] as keyof typeof STATUS_RU] as keyof typeof REV);
      return `${ctx.tr("rt", m[1])}: ${locale === "zh" ? st : st.charAt(0).toLowerCase() + st.slice(1)}`;
    }
    if ((m = s.match(/^(Перенос|Отмена|Новая аудитория): (.+)$/))) return `${W[{ Перенос: "move", Отмена: "cancel", "Новая аудитория": "roomChange" }[m[1]] as "move"]}: ${ctx.tr("subjects", m[2])}`;
    if ((m = s.match(/^Через 2 дня: (.+) — (.+)$/))) return `${W.in2days}: ${ctx.tr("assessments", m[1])} — ${ctx.tr("short", m[2])}`;
    if ((m = s.match(/^(.+)\. Максимум (\d+) баллов\. Срок — (\d{1,2}) ([а-я]+)\.$/))) return W.deadlineBody.replace("{name}", ctx.tr("subjects", m[1])).replace("{max}", m[2]).replace("{date}", date(m[3], m[4], false));
    if ((m = s.match(/^Заявка (\S+) принята\. Срок — (.+)\. Статус будет обновляться здесь\.$/))) return W.accepted.replace("{num}", m[1]).replace("{sla}", generic(m[2]));
    if ((m = s.match(/^(.+?), (\d{2}:\d{2}) · (.+)\. Тема: (.+)\.$/))) return `${generic(m[1])}, ${m[2]} · ${ctx.tr("offices", m[3])}. ${W.topic}: ${lex.exact[m[4]] ?? m[4]}.`;
    if ((m = s.match(/^С (\d{2}\.\d{2}\.\d{4}) по (\d{2}\.\d{2}\.\d{4})$/))) return `${m[1]} – ${m[2]}`;
    if ((m = s.match(/^(.+): ауд\. (\S+) → ауд\. (\S+)$/))) return `${generic(m[1])}: ${W.room.replace("{r}", m[2])} → ${W.room.replace("{r}", m[3])}`;
    return generic(s);
  };
}
const REV = { SUBMITTED: 1, IN_PROGRESS: 1, NEEDS_INFO: 1, READY: 1, ISSUED: 1, REJECTED: 1 };
export type StatusKey = keyof typeof REV;

/** Словари содержимого: демо-тексты деканата и служебные слова для шаблонов. */
export const CONTENT: Record<"en" | "zh" | "fr", Lex> = {
  en: {
    words: { room: "room {r}", was: "Was", now: "Now", cancelled: "class cancelled", move: "Rescheduled", cancel: "Cancelled", roomChange: "New room", in2days: "In 2 days", deadlineBody: "{name}. Up to {max} points. Due {date}.", accepted: "Request {num} received. Processing time — {sla}. Status updates will appear here.", workdays: "{n} working days", topic: "Topic" },
    exact: {
      // объявления
      "Запись на курсы по выбору на весенний семестр": "Electives sign-up for the spring semester",
      "Запись открыта в разделе «Успеваемость → Курсы по выбору» до 15 ноября включительно. После этой даты поменять выбор можно только заявлением.": "Sign-up is open in “Grades → Electives” until 15 November inclusive. After that, changes are possible only by application.",
      "Продление приёма заявлений на стажировки до 20 ноября": "Internship applications extended until 20 November",
      "Студенты 2–4 курсов могут подать заявку на зимнюю стажировку в международных организациях. Нужна выписка из зачётки — закажите её в «Заявках», это занимает до 5 дней.": "Students in years 2–4 can apply for a winter internship at international organisations. A transcript is required — order it under “Requests”, it takes up to 5 days.",
      "Модель ООН: открыта регистрация делегатов": "Model UN: delegate registration is open",
      "Ежегодная модель ООН пройдёт в весеннем семестре. Регистрация делегатов и волонтёров — до 1 декабря на странице студсовета.": "The annual Model UN takes place in the spring semester. Delegates and volunteers register by 1 December on the student council page.",
      "Кейс-чемпионат бизнес-клуба: регистрация команд": "Business Club case championship: team registration",
      "Команды по 3–4 человека, кейс от партнёра клуба. Финал — в начале декабря в конференц-зале главного корпуса.": "Teams of 3–4, a case from a club partner. The final is in early December in the Main Building conference hall.",
      "Справка для военкомата — закажите онлайн до 30 ноября": "Military registration certificate — order online by 30 November",
      "Студентам, обучающимся в ВУЦ и состоящим на воинском учёте: ежегодную справку по форме № 4 можно заказать в «Заявках» без визита в деканат.": "Students in military training or registered for service can order the annual Form No. 4 certificate under “Requests” without visiting the dean’s office.",
      "Консультации по выпускным работам: график научных руководителей": "Thesis consultations: supervisors’ schedule",
      "График консультаций на ноябрь–декабрь опубликован. Записаться к методисту по оформлению темы ВКР можно в разделе «Запись к методисту».": "The November–December consultation schedule is out. Book a coordinator about your thesis topic under “Book a coordinator”.",
      "Изменения в расписании корпусного автобуса": "Shuttle bus timetable changes",
      "С 9 ноября первый рейс от м. «Юго-Западная» в 07:40 вместо 07:50, добавлен рейс в 19:20 из Одинцова.": "From 9 November the first bus from Yugo-Zapadnaya leaves at 07:40 instead of 07:50; a 19:20 trip from Odintsovo has been added.",
      "Читальный зал в сессию работает до 22:00": "Reading room open until 22:00 during exams",
      "С 14 декабря по 24 января читальный зал главного корпуса открыт ежедневно с 9:00 до 22:00.": "From 14 December to 24 January the Main Building reading room is open daily 9:00–22:00.",
      "Адаптационная встреча для первокурсников": "Orientation meeting for first-year students",
      "Расскажем про БРС, Положение о деканате и как пользоваться «Меридианом». Аудитория 101, кампус Одинцово.": "We’ll explain the grading system, the dean’s office regulations and how to use Meridian. Room 101, Odintsovo campus.",
      "Деканат МЭО": "SIER dean’s office", "Студенческий офис": "Student Office", "Студсовет": "Student council", "Международный отдел": "International office", "Деканат": "Dean’s office",
      // сроки
      "Запись на курсы по выбору (весна)": "Electives sign-up (spring)", "Учебный офис · после срока — только заявлением": "Academic office · after the deadline — by application only",
      "Заявки на зимние стажировки": "Winter internship applications", "Нужна выписка из зачётки — закажите заранее": "A transcript is needed — order it in advance",
      "Справка для военкомата (ежегодно)": "Military registration certificate (annual)", "Для студентов ВУЦ и состоящих на учёте": "For military-training and registered students",
      "Регистрация на модель ООН": "Model UN registration",
      "Эссе по МФР — загрузить в LMS": "Fin. Markets essay — upload to LMS", "Семинар доц. Ковалёвой М. Р.": "Seminar, Assoc. Prof. Kovaleva M. R.",
      "Мини-тест по статистике": "Statistics mini-quiz", "Онлайн, 20 минут, в LMS": "Online, 20 minutes, in LMS",
      "Тема ВКР — согласовать с руководителем": "Thesis topic — agree with your supervisor", "Подписанный бланк — в студенческий офис": "Signed form — to the Student Office",
      "Эссе по введению в языкознание": "Introduction to Linguistics essay", "1500–2000 слов, загрузить в LMS": "1,500–2,000 words, upload to LMS",
      "Продление полиса ДМС для иностранных студентов": "Health insurance renewal for international students", "Международный отдел, ауд. 105 (Одинцово)": "International office, room 105 (Odintsovo)",
      // изменения расписания и комментарии деканата
      "Замена аудитории": "Room change", "Перенос по просьбе преподавателя (научная конференция)": "Moved at the teacher’s request (academic conference)",
      "Преподаватель на больничном, материал — в LMS.": "The teacher is on sick leave; materials are in LMS.",
      "Взяла в работу, будет готова к концу недели.": "I’ve started on it; it will be ready by the end of the week.", "Дубликат выдан.": "Duplicate issued.",
      "Приложите, пожалуйста, медицинскую справку": "Please attach a medical certificate",
      "Приложите письмо-подтверждение от работодателя с графиком стажировки — ответьте в комментарии к заявке.": "Please attach a confirmation letter from the employer with the internship schedule — reply in the request comments.",
      "Справка готова в электронном виде. Бумажный экземпляр с печатью — в студенческом офисе, ауд. 1012.": "The certificate is ready electronically. A stamped paper copy is at the Student Office, room 1012.",
      "Электронный студенческий уже выдан — дубликат пластиковой карты оформляется в бюро пропусков": "An electronic student ID has already been issued — a duplicate plastic card is issued at the pass office",
      "Объём курса (36 ч) меньше требуемого по учебному плану (72 ч). Можно подать повторно с курсом большего объёма.": "The course (36 h) is shorter than required by the curriculum (72 h). You can reapply with a longer course.",
      "Отозвана студентом": "Withdrawn by the student",
      // системные тексты уведомлений
      "Статус заявки обновлён.": "Request status updated.", "Статус обновлён.": "Status updated.", "Заявку взяли в работу.": "Your request is being processed.",
      "Документ готов — откройте его в заявке, там же QR-код для проверки.": "The document is ready — open it in the request; the verification QR code is there too.",
      "Документ готов — откройте заявку: там электронная справка с QR-кодом.": "The document is ready — open the request to see the electronic certificate with a QR code.",
      "Заявление рассмотрено.": "Your application has been reviewed.", "Вы записаны к методисту": "You have booked a coordinator",
      // данные заявок демо-студентов
      "Испания": "Spain", "Китай": "China", "Экономическая история": "Economic History", "Летняя школа другого вуза, 36 часов, оценка «отлично»": "Summer school at another university, 36 hours, grade “excellent”",
      "ПАО «Условный банк» — для оформления карты": "“Conditional Bank” PJSC — for a bank card", "ИФНС — налоговый вычет": "Tax office — tax deduction",
      "Стажировка в юридической фирме (вымышленной), 3 дня в неделю. Контрольные точки сдаю по графику.": "Internship at a (fictional) law firm, 3 days a week. I’ll take assessments on schedule.",
      "Нужна к 20 ноября, пожалуйста": "Needed by 20 November, please",
      "Справки и документы": "Certificates and documents", "Индивидуальный график": "Individual plan", "Оформление темы ВКР": "Thesis topic",
    },
  },
  zh: {
    words: { room: "{r} 教室", was: "原定", now: "现改为", cancelled: "课程取消", move: "调课", cancel: "停课", roomChange: "更换教室", in2days: "2天后截止", deadlineBody: "{name}。满分 {max} 分。截止日期：{date}。", accepted: "申请 {num} 已受理。办理时限：{sla}。状态将在此处更新。", workdays: "{n} 个工作日", topic: "事由" },
    exact: {
      "Запись на курсы по выбору на весенний семестр": "春季学期选修课报名", "Запись открыта в разделе «Успеваемость → Курсы по выбору» до 15 ноября включительно. После этой даты поменять выбор можно только заявлением.": "报名在“成绩 → 选修课”开放至11月15日（含）。此后只能通过申请更改。",
      "Продление приёма заявлений на стажировки до 20 ноября": "实习申请延长至11月20日", "Студенты 2–4 курсов могут подать заявку на зимнюю стажировку в международных организациях. Нужна выписка из зачётки — закажите её в «Заявках», это занимает до 5 дней.": "2–4年级学生可申请国际组织冬季实习。需要成绩单——请在“申请”中办理，最多需要5天。",
      "Модель ООН: открыта регистрация делегатов": "模拟联合国：代表报名开始", "Ежегодная модель ООН пройдёт в весеннем семестре. Регистрация делегатов и волонтёров — до 1 декабря на странице студсовета.": "年度模拟联合国将于春季学期举行。代表和志愿者请于12月1日前在学生会页面报名。",
      "Кейс-чемпионат бизнес-клуба: регистрация команд": "商业俱乐部案例大赛：团队报名", "Команды по 3–4 человека, кейс от партнёра клуба. Финал — в начале декабря в конференц-зале главного корпуса.": "每队3–4人，案例由俱乐部合作方提供。决赛于12月初在主楼会议厅举行。",
      "Справка для военкомата — закажите онлайн до 30 ноября": "兵役登记处证明——请于11月30日前在线申请", "Студентам, обучающимся в ВУЦ и состоящим на воинском учёте: ежегодную справку по форме № 4 можно заказать в «Заявках» без визита в деканат.": "参加军训或已进行兵役登记的学生，可在“申请”中办理年度第4号证明，无需到教务处。",
      "Консультации по выпускным работам: график научных руководителей": "毕业论文答疑：导师时间表", "График консультаций на ноябрь–декабрь опубликован. Записаться к методисту по оформлению темы ВКР можно в разделе «Запись к методисту».": "11–12月答疑时间表已公布。可在“预约教务员”中预约论文选题事宜。",
      "Изменения в расписании корпусного автобуса": "校车时刻表调整", "С 9 ноября первый рейс от м. «Юго-Западная» в 07:40 вместо 07:50, добавлен рейс в 19:20 из Одинцова.": "自11月9日起，“西南站”首班车改为07:40（原07:50），并新增奥金佐沃19:20班次。",
      "Читальный зал в сессию работает до 22:00": "考试期间阅览室开放至22:00", "С 14 декабря по 24 января читальный зал главного корпуса открыт ежедневно с 9:00 до 22:00.": "12月14日至1月24日，主楼阅览室每天9:00–22:00开放。",
      "Адаптационная встреча для первокурсников": "新生适应见面会", "Расскажем про БРС, Положение о деканате и как пользоваться «Меридианом». Аудитория 101, кампус Одинцово.": "介绍评分制度、教务处规定以及如何使用 Meridian。奥金佐沃校区101教室。",
      "Деканат МЭО": "国经学院教务处", "Студенческий офис": "学生事务中心", "Студсовет": "学生会", "Международный отдел": "国际处", "Деканат": "教务处",
      "Запись на курсы по выбору (весна)": "选修课报名（春季）", "Учебный офис · после срока — только заявлением": "教务办公室 · 逾期只能申请", "Заявки на зимние стажировки": "冬季实习申请", "Нужна выписка из зачётки — закажите заранее": "需要成绩单——请提前办理",
      "Справка для военкомата (ежегодно)": "兵役登记处证明（每年）", "Для студентов ВУЦ и состоящих на учёте": "适用于军训及已登记学生", "Регистрация на модель ООН": "模拟联合国报名",
      "Эссе по МФР — загрузить в LMS": "金融市场论文——上传至LMS", "Семинар доц. Ковалёвой М. Р.": "科瓦廖娃副教授研讨课", "Мини-тест по статистике": "统计学小测", "Онлайн, 20 минут, в LMS": "线上，20分钟，在LMS",
      "Тема ВКР — согласовать с руководителем": "论文题目——与导师确定", "Подписанный бланк — в студенческий офис": "签字表格交学生事务中心", "Эссе по введению в языкознание": "语言学导论论文", "1500–2000 слов, загрузить в LMS": "1500–2000词，上传至LMS",
      "Продление полиса ДМС для иностранных студентов": "外国学生医疗保险续保", "Международный отдел, ауд. 105 (Одинцово)": "国际处，105教室（奥金佐沃）",
      "Замена аудитории": "更换教室", "Перенос по просьбе преподавателя (научная конференция)": "应教师要求调课（学术会议）", "Преподаватель на больничном, материал — в LMS.": "教师病假，资料见LMS。",
      "Взяла в работу, будет готова к концу недели.": "已开始办理，本周末前完成。", "Дубликат выдан.": "补办证件已发放。", "Приложите, пожалуйста, медицинскую справку": "请附上医疗证明",
      "Приложите письмо-подтверждение от работодателя с графиком стажировки — ответьте в комментарии к заявке.": "请附上雇主出具的实习时间安排确认函——在申请评论中回复。",
      "Справка готова в электронном виде. Бумажный экземпляр с печатью — в студенческом офисе, ауд. 1012.": "电子证明已办好。盖章纸质版请到学生事务中心1012室领取。",
      "Электронный студенческий уже выдан — дубликат пластиковой карты оформляется в бюро пропусков": "电子学生证已发放——补办实体卡请到证件办公室",
      "Объём курса (36 ч) меньше требуемого по учебному плану (72 ч). Можно подать повторно с курсом большего объёма.": "课程学时（36小时）少于培养方案要求（72小时）。可使用学时更多的课程重新申请。",
      "Отозвана студентом": "学生已撤回", "Статус заявки обновлён.": "申请状态已更新。", "Статус обновлён.": "状态已更新。", "Заявку взяли в работу.": "申请已开始办理。",
      "Документ готов — откройте его в заявке, там же QR-код для проверки.": "文件已办好——请在申请中查看，内附验证二维码。", "Документ готов — откройте заявку: там электронная справка с QR-кодом.": "文件已办好——打开申请即可查看带二维码的电子证明。",
      "Заявление рассмотрено.": "申请已审核。", "Вы записаны к методисту": "已预约教务员",
      "Испания": "西班牙", "Китай": "中国", "Экономическая история": "经济史", "Летняя школа другого вуза, 36 часов, оценка «отлично»": "其他大学暑期学校，36学时，成绩“优秀”",
      "ПАО «Условный банк» — для оформления карты": "“示例银行”股份公司——办卡用", "ИФНС — налоговый вычет": "税务局——退税", "Стажировка в юридической фирме (вымышленной), 3 дня в неделю. Контрольные точки сдаю по графику.": "在一家（虚构的）律师事务所实习，每周3天。按计划完成考核。",
      "Нужна к 20 ноября, пожалуйста": "请在11月20日前办好", "Справки и документы": "证明与文件", "Индивидуальный график": "个人学习计划", "Оформление темы ВКР": "论文选题",
    },
  },
  fr: {
    words: { room: "salle {r}", was: "Avant", now: "Désormais", cancelled: "cours annulé", move: "Cours déplacé", cancel: "Cours annulé", roomChange: "Nouvelle salle", in2days: "Dans 2 jours", deadlineBody: "{name}. Jusqu’à {max} points. Échéance : {date}.", accepted: "Demande {num} reçue. Délai : {sla}. Le statut sera mis à jour ici.", workdays: "{n} jours ouvrés", topic: "Objet" },
    exact: {
      "Запись на курсы по выбору на весенний семестр": "Inscription aux options du semestre de printemps", "Запись открыта в разделе «Успеваемость → Курсы по выбору» до 15 ноября включительно. После этой даты поменять выбор можно только заявлением.": "Inscriptions ouvertes dans « Résultats → Options » jusqu’au 15 novembre inclus. Ensuite, tout changement se fait sur demande.",
      "Продление приёма заявлений на стажировки до 20 ноября": "Candidatures aux stages prolongées jusqu’au 20 novembre", "Студенты 2–4 курсов могут подать заявку на зимнюю стажировку в международных организациях. Нужна выписка из зачётки — закажите её в «Заявках», это занимает до 5 дней.": "Les étudiants de 2e à 4e année peuvent postuler à un stage d’hiver dans une organisation internationale. Un relevé de notes est requis — commandez-le dans « Demandes » (jusqu’à 5 jours).",
      "Модель ООН: открыта регистрация делегатов": "Simulation de l’ONU : inscription des délégués ouverte", "Ежегодная модель ООН пройдёт в весеннем семестре. Регистрация делегатов и волонтёров — до 1 декабря на странице студсовета.": "La simulation annuelle de l’ONU aura lieu au printemps. Inscription des délégués et bénévoles jusqu’au 1er décembre sur la page du conseil étudiant.",
      "Кейс-чемпионат бизнес-клуба: регистрация команд": "Concours de cas du Business Club : inscription des équipes", "Команды по 3–4 человека, кейс от партнёра клуба. Финал — в начале декабря в конференц-зале главного корпуса.": "Équipes de 3–4 personnes, cas proposé par un partenaire du club. Finale début décembre dans la salle de conférence du bâtiment principal.",
      "Справка для военкомата — закажите онлайн до 30 ноября": "Certificat pour le bureau militaire — à commander en ligne avant le 30 novembre", "Студентам, обучающимся в ВУЦ и состоящим на воинском учёте: ежегодную справку по форме № 4 можно заказать в «Заявках» без визита в деканат.": "Étudiants en formation militaire ou recensés : le certificat annuel n° 4 se commande dans « Demandes », sans passer au décanat.",
      "Консультации по выпускным работам: график научных руководителей": "Mémoires : planning des directeurs", "График консультаций на ноябрь–декабрь опубликован. Записаться к методисту по оформлению темы ВКР можно в разделе «Запись к методисту».": "Le planning de novembre–décembre est publié. Pour le sujet de mémoire, prenez rendez-vous dans « Rendez-vous ».",
      "Изменения в расписании корпусного автобуса": "Changements d’horaires de la navette", "С 9 ноября первый рейс от м. «Юго-Западная» в 07:40 вместо 07:50, добавлен рейс в 19:20 из Одинцова.": "À partir du 9 novembre, premier départ de Iougo-Zapadnaïa à 07:40 au lieu de 07:50 ; départ supplémentaire à 19:20 depuis Odintsovo.",
      "Читальный зал в сессию работает до 22:00": "Salle de lecture ouverte jusqu’à 22:00 pendant les examens", "С 14 декабря по 24 января читальный зал главного корпуса открыт ежедневно с 9:00 до 22:00.": "Du 14 décembre au 24 janvier, la salle de lecture du bâtiment principal est ouverte tous les jours de 9:00 à 22:00.",
      "Адаптационная встреча для первокурсников": "Réunion d’accueil des 1re année", "Расскажем про БРС, Положение о деканате и как пользоваться «Меридианом». Аудитория 101, кампус Одинцово.": "Présentation du système de notation, du règlement du décanat et de Meridian. Salle 101, campus d’Odintsovo.",
      "Деканат МЭО": "Décanat REI", "Студенческий офис": "Bureau des étudiants", "Студсовет": "Conseil étudiant", "Международный отдел": "Service international", "Деканат": "Décanat",
      "Запись на курсы по выбору (весна)": "Inscription aux options (printemps)", "Учебный офис · после срока — только заявлением": "Scolarité · après l’échéance — uniquement sur demande", "Заявки на зимние стажировки": "Candidatures aux stages d’hiver", "Нужна выписка из зачётки — закажите заранее": "Relevé de notes requis — à commander à l’avance",
      "Справка для военкомата (ежегодно)": "Certificat pour le bureau militaire (annuel)", "Для студентов ВУЦ и состоящих на учёте": "Pour les étudiants en formation militaire et recensés", "Регистрация на модель ООН": "Inscription à la simulation de l’ONU",
      "Эссе по МФР — загрузить в LMS": "Dissertation de marchés fin. — à déposer sur LMS", "Семинар доц. Ковалёвой М. Р.": "TD de Mme Kovaleva M. R.", "Мини-тест по статистике": "Mini-test de statistiques", "Онлайн, 20 минут, в LMS": "En ligne, 20 minutes, sur LMS",
      "Тема ВКР — согласовать с руководителем": "Sujet de mémoire — à valider avec le directeur", "Подписанный бланк — в студенческий офис": "Formulaire signé — au bureau des étudiants", "Эссе по введению в языкознание": "Dissertation d’introduction à la linguistique", "1500–2000 слов, загрузить в LMS": "1 500–2 000 mots, à déposer sur LMS",
      "Продление полиса ДМС для иностранных студентов": "Renouvellement de l’assurance santé des étudiants étrangers", "Международный отдел, ауд. 105 (Одинцово)": "Service international, salle 105 (Odintsovo)",
      "Замена аудитории": "Changement de salle", "Перенос по просьбе преподавателя (научная конференция)": "Déplacé à la demande de l’enseignant (colloque)", "Преподаватель на больничном, материал — в LMS.": "Enseignant en arrêt maladie ; supports sur LMS.",
      "Взяла в работу, будет готова к концу недели.": "C’est en cours, ce sera prêt d’ici la fin de la semaine.", "Дубликат выдан.": "Duplicata remis.", "Приложите, пожалуйста, медицинскую справку": "Merci de joindre un certificat médical",
      "Приложите письмо-подтверждение от работодателя с графиком стажировки — ответьте в комментарии к заявке.": "Joignez une lettre de l’employeur avec le planning du stage — répondez dans les commentaires de la demande.",
      "Справка готова в электронном виде. Бумажный экземпляр с печатью — в студенческом офисе, ауд. 1012.": "L’attestation électronique est prête. L’exemplaire papier tamponné est au bureau des étudiants, salle 1012.",
      "Электронный студенческий уже выдан — дубликат пластиковой карты оформляется в бюро пропусков": "La carte d’étudiant électronique est déjà délivrée — le duplicata de la carte plastique se fait au bureau des badges",
      "Объём курса (36 ч) меньше требуемого по учебному плану (72 ч). Можно подать повторно с курсом большего объёма.": "Le cours (36 h) est plus court que celui du programme (72 h). Vous pouvez redéposer une demande avec un cours plus long.",
      "Отозвана студентом": "Retirée par l’étudiant", "Статус заявки обновлён.": "Statut de la demande mis à jour.", "Статус обновлён.": "Statut mis à jour.", "Заявку взяли в работу.": "Votre demande est en cours de traitement.",
      "Документ готов — откройте его в заявке, там же QR-код для проверки.": "Le document est prêt — ouvrez-le dans la demande ; le QR code de vérification s’y trouve aussi.", "Документ готов — откройте заявку: там электронная справка с QR-кодом.": "Le document est prêt — ouvrez la demande pour voir l’attestation électronique avec QR code.",
      "Заявление рассмотрено.": "Votre demande a été examinée.", "Вы записаны к методисту": "Rendez-vous confirmé",
      "Испания": "Espagne", "Китай": "Chine", "Экономическая история": "Histoire économique", "Летняя школа другого вуза, 36 часов, оценка «отлично»": "École d’été d’une autre université, 36 heures, note « excellent »",
      "ПАО «Условный банк» — для оформления карты": "Banque fictive SA — pour une carte bancaire", "ИФНС — налоговый вычет": "Impôts — déduction fiscale", "Стажировка в юридической фирме (вымышленной), 3 дня в неделю. Контрольные точки сдаю по графику.": "Stage dans un cabinet d’avocats (fictif), 3 jours par semaine. Je passe les contrôles selon le calendrier.",
      "Нужна к 20 ноября, пожалуйста": "Nécessaire pour le 20 novembre, s’il vous plaît", "Справки и документы": "Attestations et documents", "Индивидуальный график": "Aménagement d’études", "Оформление темы ВКР": "Sujet de mémoire",
    },
  },
};
