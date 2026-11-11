import type { Shape } from "@/i18n/core";
import type ru from "../ru/appointments";

const appointments: Shape<typeof ru> = {
  title: "Rendez-vous au bureau des étudiants",
  subtitle: "Plus de file d’attente devant la porte : choisissez un créneau et venez à l’heure",
  mine: "Mes rendez-vous",
  dayNear: "{near}, {weekday}",
  cancel: "Annuler",
  cancelTitle: "Annuler le rendez-vous ?",
  cancelText: "{day}, {time} — « {topic} ». Le créneau sera libéré et un autre étudiant pourra le prendre.",
  cancelConfirm: "Oui, annuler le rendez-vous",
  newTitle: "Nouveau rendez-vous",
  emptyTitle: "Aucun créneau libre",
  emptyText: "De nouveaux créneaux sont ouverts chaque lundi. Question urgente ? Demandez à l’assistant.",
  history: "Rendez-vous passés et annulés",
  cancelled: "annulé",
  done: "effectué",
  topics: {
    docs: "Attestations et documents",
    plan: "Aménagement d’études",
    retake: "Rattrapage / différence de programme",
    transfer: "Transfert, réintégration, congé académique",
    thesis: "Sujet du mémoire de fin d’études",
    misc: "Autre",
  },
  book: {
    success: "C’est fait ! Le rendez-vous apparaît ci-dessus, un rappel arrivera dans vos notifications.",
    again: "Prendre un autre rendez-vous",
    day: "Jour",
    slots: { one: "{n} créneau", other: "{n} créneaux" },
    time: "Heure (20 minutes)",
    topic: "Objet de la visite",
    comment: "À apporter / précisions",
    optional: "Facultatif",
    submitting: "Réservation…",
    submit: "Réserver",
    pick: "Choisissez un créneau",
  },
  errors: {
    slot: "Choisissez un créneau",
    topic: "Décrivez brièvement l’objet de votre visite",
    limit: "Vous ne pouvez avoir que deux rendez-vous actifs — annulez-en un",
    taken: "Ce créneau vient d’être pris. Choisissez-en un autre.",
  },
};
export default appointments;
