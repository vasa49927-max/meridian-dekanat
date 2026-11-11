/** Лента уведомлений. */
const notifications = {
  filters: "Фильтры",
  filter: { unread: "Непрочитанные", important: "Важные", SCHEDULE: "Расписание", REQUEST: "Заявки", ANNOUNCEMENT: "Объявления", DEADLINE: "Сроки" },
  unread: "Непрочитанных: {n}", allRead: "Всё прочитано", markAll: "Прочитать все", closeAnnouncement: "Закрыть объявление",
  emptyUnread: "Непрочитанных нет", empty: "Здесь пока пусто",
  emptyText: "Изменения расписания, статусы заявок и объявления деканата появятся здесь автоматически.",
  kind: { SCHEDULE: "Расписание", REQUEST: "Заявка", ANNOUNCEMENT: "Объявление", DEADLINE: "Срок", APPOINTMENT: "Запись", GRADE: "Оценка" },
  important: "важное", notRead: "Не прочитано",
};
export default notifications;
