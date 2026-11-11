import type { Shape } from "@/i18n/core";
import type ru from "../ru/today";

const today: Shape<typeof ru> = {
  greeting: { morning: "Good morning, {name}", day: "Good afternoon, {name}", evening: "Good evening, {name}", night: "Good night, {name}" },
  next: {
    teacher: "Teacher", position: { docent: "Associate Professor", prof: "Professor", senior: "Senior Lecturer", lect: "Lecturer", colonel: "Colonel" },
    now: "In progress", next: "Next class", left: "{time} left", in: "in {time}",
    day: "Day", start: "Starts", room: "Room", until: "until {time}", nearWeekday: "{near}, {weekday}",
    aria: "{label}: {title}, {weekday}, {date}, at {time}, room {room}",
    moved: "Class rescheduled", usually: "usually: {text}", prev: "{day}, {time}, room {room}", progress: "Time elapsed in class",
    noMore: "No more classes", noMoreText: "The semester is over or classes haven’t been scheduled yet. The exam timetable is in “Timetable”.",
  },
  dur: {
    min: "{n} min", hm: "{h} h {m} min", h: "{n} h",
    days: { one: "{n} day", other: "{n} days" },
  },
  grades: {
    title: "How your studies are going", pace1: "of possible points", pace2: "this semester",
    dayPoints: "Points in this day’s courses", todayPoints: "Points in today’s courses",
    auto: "automatic", risk: "at risk", toAuto: "{n} to automatic", toAutoHint: "points still needed for an automatic grade",
    autoDone: "Automatic grades so far:", autoOf: "{n} of {total}", avg: "Grade point average:", riskLabel: "At risk:", noRisk: "No risks — keep it up",
  },
  day: {
    week: "Week", tomorrow: "Tomorrow, {date}",
    lessons: { one: "{n} class", other: "{n} classes" },
    none: "no classes", nextDayNote: "No classes today — here is the next study day.",
    cancelled: "Class cancelled", roomChanged: "Now room {room} (instead of {prev})", movedHere: "Moved here · room {room}",
    meta: "{type} · room {room}, bldg. {building}", empty: "No classes today", nearest: "Next one: {day} at {time}.",
  },
  ai: {
    title: "Dean’s office assistant", text: "Answers using the regulations and your data, and can fill in a request.",
    label: "Question for the assistant", placeholder: "Your question for the dean’s office", ask: "Ask",
  },
  deadlines: { workTitle: "{work} — {short}", workDesc: "{name} · up to {max} pts", title: "Upcoming deadlines", empty: "No deadlines on the horizon" },
  requests: { title: "My requests", needsInfo: "reply to the dean’s office", ready: "open the document", due: "by {date}", empty: "No active requests.", order: "Order a certificate" },
  news: { title: "Announcements", important: "important", empty: "No new announcements.", all: "All notifications" },
  more: {
    unread: { one: "{n} unread", other: "{n} unread" },
    allRead: "all read", assistant: "Dean’s office assistant", assistantHint: "AI answers using the regulations and your data",
    appointmentsHint: "no waiting in line", profileHint: "details, languages, sessions",
  },
  quick: {"aria": "Quick actions", "cert": "Order a certificate", "week": "This week’s timetable", "appointment": "Book a coordinator", "map": "Route to class", "request": "Request"},
};
export default today;
