import type { Shape } from "@/i18n/core";
import type ru from "../ru/appointments";

const appointments: Shape<typeof ru> = {
  title: "Book a coordinator",
  subtitle: "No more queuing at the door: pick a time and come exactly then",
  mine: "My appointments",
  dayNear: "{near}, {weekday}",
  cancel: "Cancel",
  cancelTitle: "Cancel appointment?",
  cancelText: "{day}, {time} — “{topic}”. The slot will be released and another student may take it.",
  cancelConfirm: "Yes, cancel appointment",
  newTitle: "New appointment",
  emptyTitle: "No free slots",
  emptyText: "New slots appear every Monday. Urgent question? Ask the assistant.",
  history: "Past and cancelled appointments",
  cancelled: "cancelled",
  done: "attended",
  topics: {
    docs: "Certificates and documents",
    plan: "Individual study plan",
    retake: "Resit / academic difference",
    transfer: "Transfer, reinstatement, academic leave",
    thesis: "Graduation thesis topic",
    misc: "Other",
  },
  book: {
    success: "Done! Your appointment is shown above; a reminder will arrive in your notifications.",
    again: "Book another",
    day: "Day",
    slots: { one: "{n} slot", other: "{n} slots" },
    time: "Time (20 minutes)",
    topic: "Purpose of visit",
    comment: "What to bring / details",
    optional: "Optional",
    submitting: "Booking…",
    submit: "Book",
    pick: "Choose a time",
  },
  errors: {
    slot: "Choose a time",
    topic: "Briefly describe the purpose of your visit",
    limit: "You can have at most two active appointments — cancel one of them first",
    taken: "This time was just taken. Please choose another.",
  },
};
export default appointments;
