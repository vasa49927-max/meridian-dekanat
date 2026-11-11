import type { Shape } from "@/i18n/core";
import type ru from "../ru/assistant";

const assistant: Shape<typeof ru> = {
  title: "Dean’s office assistant",
  modeLlm: "GigaChat · ",
  modeOffline: "Regulations search mode · ",
  subtitle: "answers using the Regulations and your data, with references to the relevant clauses. Sees only your data.",
  offlineLang: "Offline mode (without AI) answers in Russian.",
  hello: "Hello, {name}! Ask about certificates, exams, your timetable or the rules — or ask me to prepare a request.",
  suggest: {
    s1: "How am I doing this exam session?",
    s2: "Which certificate do I need for a Spanish visa?",
    s3: "How do I get an automatic credit?",
    s4: "I need a certificate for the military registration office",
    s5: "Can I reschedule an exam because of an academic competition?",
    s6: "When are the coordinator’s office hours?",
  },
  sources: "Regulations:",
  point: "cl. {id}",
  fill: "Fill in: {title}",
  offlineAnswer: "Answer compiled from the Regulations without AI (in Russian)",
  typing: "Assistant is typing",
  inputLabel: "Your question",
  placeholder: "e.g. which certificate do I need for the military office?",
  send: "Send",
  disclaimer: "The assistant can make mistakes — check against the Regulations. It never submits requests itself: you review the form and send it.",
  errors: {
    generic: "Error",
    network: "No connection to the server. Check your internet and try again.",
    badRequest: "Invalid request",
    tooMany: "Too many questions this hour. Try again later or book a coordinator.",
  },
};
export default assistant;
