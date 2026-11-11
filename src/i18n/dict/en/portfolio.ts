import type { Shape } from "@/i18n/core";
import type ru from "../ru/portfolio";

const portfolio: Shape<typeof ru> = {
  "title": "Portfolio",
  "subtitle": "Your achievements during your studies — and a CV built from them in one click",
  "cv": "CV (PDF)",
  "kinds": {
    "OLYMPIAD": "Olympiad",
    "CONFERENCE": "Conference",
    "INTERNSHIP": "Internship",
    "CERTIFICATE": "Certificate",
    "VOLUNTEER": "Volunteering",
    "PUBLICATION": "Publication"
  },
  "verified": "Verified by the dean’s office",
  "unverified": "Added by you",
  "remove": "Delete",
  "removeAria": "Delete: {title}",
  "removeConfirm": {
    "title": "Delete this entry?",
    "body": "It will disappear from your portfolio and CV.",
    "ok": "Delete"
  },
  "empty": {
    "title": "Your portfolio is empty",
    "text": "Add olympiads, internships and certificates — your CV will be built from them."
  },
  "add": {
    "title": "Add an achievement",
    "kind": "Type",
    "name": "Title",
    "namePlaceholder": "e.g. Internship in the analytics department",
    "org": "Organisation",
    "date": "Month and year",
    "description": "Short description of the result",
    "submit": "Add",
    "sending": "Saving…",
    "done": "Added to your portfolio",
    "note": "After checking documents, the dean’s office can mark the entry as verified."
  },
  "errors": {
    "fill": "Fill in the required fields",
    "title": "Title must be 3–200 characters",
    "date": "Enter the month and year",
    "limit": "A portfolio can have at most 50 entries"
  },
  "cvPage": {
    "title": "CV",
    "print": "Print or save as PDF",
    "back": "Back to portfolio",
    "education": "Education",
    "achievements": "Achievements",
    "languages": "Languages",
    "contacts": "Contacts",
    "student": "Year {course} student",
    "program": "{code} “{name}”",
    "avg": "Average grade: {avg} out of 100",
    "since": "since {year}",
    "generated": "Generated in the Meridian account",
    "verifiedMark": "✓ verified"
  }
};
export default portfolio;
