/** Экран «Сегодня» (главная студента), карточка следующей пары и страница «Ещё» (more). */
const today = {
  greeting: { morning: "Доброе утро, {name}", day: "Добрый день, {name}", evening: "Добрый вечер, {name}", night: "Доброй ночи, {name}" },
  next: {
    teacher: "Преподаватель", position: { docent: "Доцент", prof: "Профессор", senior: "Старший преподаватель", lect: "Преподаватель", colonel: "Полковник" },
    now: "Идёт сейчас", next: "Следующая пара", left: "ещё {time}", in: "через {time}",
    day: "День", start: "Начало", room: "Аудитория", until: "до {time}", nearWeekday: "{near}, {weekday}",
    aria: "{label}: {title}, {weekday}, {date}, в {time}, аудитория {room}",
    moved: "Пара перенесена", usually: "обычно: {text}", prev: "{day}, {time}, ауд. {room}", progress: "Прошло времени пары",
    noMore: "Пар больше нет", noMoreText: "Семестр закончился или занятия ещё не поставлены. Расписание сессии — в разделе «Расписание».",
  },
  dur: {
    min: "{n} мин", hm: "{h} ч {m} мин", h: "{n} ч",
    days: { one: "{n} день", few: "{n} дня", many: "{n} дней", other: "{n} дня" },
  },
  grades: {
    title: "Как дела с учёбой", pace1: "баллов от возможного", pace2: "в этом семестре",
    dayPoints: "Баллы по предметам этого дня", todayPoints: "Баллы по сегодняшним предметам",
    auto: "автомат", risk: "риск", toAuto: "до автомата {n}", toAutoHint: "столько баллов не хватает до автомата",
    autoDone: "Автомат уже есть:", autoOf: "{n} из {total}", avg: "Средний балл зачётки:", riskLabel: "Риск:", noRisk: "Рисков нет — так держать",
  },
  day: {
    week: "Неделя", tomorrow: "Завтра, {date}",
    lessons: { one: "{n} пара", few: "{n} пары", many: "{n} пар", other: "{n} пары" },
    none: "без пар", nextDayNote: "Сегодня пар нет — вот ближайший учебный день.",
    cancelled: "Пары не будет", roomChanged: "Теперь ауд. {room} (вместо {prev})", movedHere: "Перенесена сюда · ауд. {room}",
    meta: "{type} · ауд. {room}, корп. {building}", empty: "Сегодня пар нет", nearest: "Ближайшая — {day} в {time}.",
  },
  ai: {
    title: "Помощник деканата", text: "Отвечает по Положению и вашим данным, умеет заполнить заявку.",
    label: "Вопрос помощнику", placeholder: "Ваш вопрос деканату", ask: "Спросить",
  },
  deadlines: { workTitle: "{work} — {short}", workDesc: "{name} · до {max} б.", title: "Ближайшие сроки", empty: "Сроков на горизонте нет" },
  requests: { title: "Мои заявки", needsInfo: "ответьте деканату", ready: "откройте документ", due: "до {date}", empty: "Активных заявок нет.", order: "Заказать справку" },
  news: { title: "Объявления", important: "важное", empty: "Новых объявлений нет.", all: "Все уведомления" },
  more: {
    unread: { one: "{n} непрочитанных", few: "{n} непрочитанных", many: "{n} непрочитанных", other: "{n} непрочитанных" },
    allRead: "всё прочитано", assistant: "Помощник деканата", assistantHint: "ИИ отвечает по Положению и вашим данным",
    appointmentsHint: "без живой очереди", profileHint: "данные, языки, сессии",
  },
  quick: {"aria": "Быстрые действия", "cert": "Заказать справку", "week": "Расписание на неделю", "appointment": "Записаться к методисту", "map": "Как пройти на пару", "request": "Заявка"},
};
export default today;
