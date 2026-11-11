import type { Shape } from "@/i18n/core";
import type ru from "../ru/notifications";

const notifications: Shape<typeof ru> = {
  filters: "Filters",
  filter: { unread: "Unread", important: "Important", SCHEDULE: "Timetable", REQUEST: "Requests", ANNOUNCEMENT: "Announcements", DEADLINE: "Deadlines" },
  unread: "Unread: {n}", allRead: "All caught up", markAll: "Mark all as read", closeAnnouncement: "Close announcement",
  emptyUnread: "No unread notifications", empty: "Nothing here yet",
  emptyText: "Timetable changes, request updates and dean’s office announcements will appear here automatically.",
  kind: { SCHEDULE: "Timetable", REQUEST: "Request", ANNOUNCEMENT: "Announcement", DEADLINE: "Deadline", APPOINTMENT: "Appointment", GRADE: "Grade" },
  important: "important", notRead: "Unread",
};
export default notifications;
