import type { Shape } from "@/i18n/core";
import type ru from "../ru/electives";

const electives: Shape<typeof ru> = {
  "title": "Elective courses",
  "tab": "Electives",
  "subtitle": "Spring semester 2027 · cross-faculty courses",
  "window": {
    "open": "Enrolment is open until {date}",
    "openLeft": {"one": "{n} day left", "other": "{n} days left"},
    "closed": "Enrolment closed on {date}. You can still change your choice by applying to the academic office.",
    "soon": "Enrolment opens on {date}"
  },
  "rules": {
    "title": "How it works",
    "r1": "You can choose up to {n} courses.",
    "r2": "If there are seats, you are enrolled straight away. If not, you join the waiting list.",
    "r3": "If someone drops out, the first person on the waiting list is enrolled automatically and notified."
  },
  "mine": "{n} of {max} chosen",
  "seats": "{taken} of {capacity} seats",
  "free": {
    "one": "{n} seat left",
    "other": "{n} seats left"
  },
  "full": "no seats",
  "waiting": "on the waiting list: {n}",
  "credits": "{n} credits",
  "status": {
    "ENROLLED": "You are enrolled",
    "WAITLIST": "You are no. {pos} on the waiting list"
  },
  "actions": {
    "enroll": "Enrol",
    "waitlist": "Join the waiting list",
    "drop": "Drop",
    "dropConfirm": {
      "title": "Drop this course?",
      "body": "Your seat will go to the first person on the waiting list. You can only get it back if seats become available again.",
      "ok": "Yes, drop"
    }
  },
  "done": {
    "ENROLLED": "You are enrolled in the course",
    "WAITLIST": "You are on the waiting list — we will let you know if a seat frees up",
    "drop": "You have dropped the course"
  },
  "errors": {
    "closed": "Elective enrolment is closed",
    "course": "This course is open to senior students only",
    "limit": "You can choose at most two courses — drop one first",
    "exists": "You have already chosen this course",
    "notFound": "Course not found",
    "notChosen": "You are not enrolled in this course"
  },
  "slot": "{day}, {time} · room {room}",
  "fromCourse": "from year {n}"
};
export default electives;
