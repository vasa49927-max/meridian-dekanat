import type { Shape } from "@/i18n/core";
import type ru from "../ru/survey";

const survey: Shape<typeof ru> = {
  "title": "Course feedback",
  "subtitle": "Anonymous: the dean’s office only sees average scores, and only once at least three students have answered",
  "how": {
    "title": "How anonymity is protected",
    "p1": "Your answer is stored without your name or time — only the date.",
    "p2": "A separate encrypted “already answered” mark prevents voting twice. It cannot be linked to your answer.",
    "p3": "The dean’s office sees a course’s results only when there are at least three answers."
  },
  "q": {
    "clarity": "Is the material explained clearly",
    "teacher": "How do you rate the teacher’s work",
    "workload": "Is the workload manageable",
    "comment": "What could be improved (optional)",
    "commentHint": "Do not include names or details that could identify you."
  },
  "scale": {
    "low": "poor",
    "high": "excellent",
    "aria": "{q}: {n} of 5"
  },
  "send": "Submit anonymously",
  "sending": "Submitting…",
  "done": "Thank you! Your answer has been recorded anonymously.",
  "voted": "You have already answered",
  "left": {
    "one": "{n} course left to rate",
    "other": "{n} courses left to rate"
  },
  "allDone": "You have rated all courses this semester — thank you!",
  "empty": "There are no courses to rate this semester.",
  "banner": {
    "text": "Rate this semester’s courses — anonymously, 1 minute per course.",
    "cta": "Take the survey"
  },
  "errors": {
    "fill": "Please answer all three questions",
    "already": "You have already answered for this course",
    "notFound": "Course not found"
  }
};
export default survey;
