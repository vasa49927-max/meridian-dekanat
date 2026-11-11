import type { Shape } from "@/i18n/core";
import type ru from "../ru/common";

const common: Shape<typeof ru> = {
  brand: "Meridian",
  tagline: "digital dean’s office",
  brandHome: "Meridian — home",
  disclaimerStrong: "Concept for the MGIMO AI contest.",
  disclaimerRest: "Not an official MGIMO service. All people and data are fictional.",
  nav: {
    sections: "Sections", mainSections: "Main sections", today: "Today", schedule: "Timetable", grades: "Grades", requests: "Requests & certificates",
    requestsShort: "Requests", notifications: "Notifications", assistant: "Assistant", appointments: "Book a coordinator", profile: "Profile", more: "More",
    unreadCount: { one: "{n} unread", other: "{n} unread" },
    staffAnalytics: "Management dashboard", staffRisks: "Students at risk", survey: "Course feedback", map: "How to get there", portfolio: "Portfolio", staffSurveys: "Course surveys", staffQueue: "Request queue", staffAnnouncements: "Announcements", staffLessons: "Class changes", staffReception: "Student reception", staffDemo: "Demo data",
    hasUnread: "You have unread notifications", skip: "Skip to content", logout: "Log out", studentRole: "Year {course} · student",
  },
  top: { search: "Search and actions", searchAria: "Search and actions (Ctrl+K)", notifications: "Notifications", notificationsUnread: "Notifications: {n} unread" },
  theme: { dark: "Dark theme", light: "Light theme", toDark: "Switch to dark theme", toLight: "Switch to light theme" },
  offline: "You are offline. Showing the last loaded version — actions will be available once you reconnect.",
  loading: "Loading…", loadingAria: "Loading",
  confirm: { yes: "Yes", keep: "No, keep it", back: "No, go back" },
  actions: { back: "Back", next: "Next", save: "Save", saving: "Saving…", cancel: "Cancel", close: "Close", all: "All", more: "Details", retry: "Try again", showMore: "Show more" },
  avatar: "Avatar: {name}",
  status: { SUBMITTED: "Submitted", IN_PROGRESS: "In progress", NEEDS_INFO: "Action needed", READY: "Ready", ISSUED: "Issued", REJECTED: "Rejected" },
  lessonType: { LECTURE: "Lecture", SEMINAR: "Seminar", PRACTICE: "Practical", LANGUAGE: "Foreign language", MILITARY: "Military training", CONSULTATION: "Consultation", EXAM: "Exam", CREDIT: "Credit test" },
  control: { EXAM: "Exam", CREDIT: "Pass/fail", GRADED_CREDIT: "Graded credit" },
  lang: { label: "Language", note: "Messages from the dean’s office are shown in the original language." },
  tour: {
    step: "Tip {i} of {n}", welcome: "welcome, {name}", close: "Close tips", start: "Got it, let’s start", reopen: "Tips for the app",
    s1t: "Everything important is on “Today”", s1: "Your next class with room and countdown, and right below it — this week’s changes and cancellations. No more searching the group chat.",
    s2t: "“Grades” tells you where to start", s2: "How many points you have, how many you need for an automatic grade, and what’s due next. The “what if” calculator is in every card.",
    s3t: "Certificates without queues", s3: "“Requests” → choose a document → a one-minute form. The status updates right here, and the certificate comes with a verification QR code.",
    s4t: "Search and assistant", s4: "Ctrl+K (or the magnifier at the top) takes you anywhere. The “Assistant” answers using the regulations and can fill in a request — you send it.",
  },
  palette: {
    label: "Search the app", placeholder: "Section, course, certificate, action…", empty: "Nothing found. Try asking the", emptyAssistant: "assistant",
    quick: "Quick actions", order: "Order: {title}", book: "Book a coordinator", ask: "Ask the assistant", calendar: "Timetable in your phone calendar",
    sections: "Sections", theme: "Toggle theme", myCourses: "My courses", myRequests: "My requests", lastRequests: "Recent requests",
    hintNav: "↑↓ select, Enter open", hintEsc: "Esc close",
  },
  ics: { cancelled: "[CANCELLED]", moved: "[RESCHEDULED]", room: "room {room}", change: "Change: {note}", cancelNote: "Cancelled: {note}", moveDefault: "rescheduled", calName: "Meridian — timetable" },
};
export default common;
