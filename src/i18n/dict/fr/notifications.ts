import type { Shape } from "@/i18n/core";
import type ru from "../ru/notifications";

const notifications: Shape<typeof ru> = {
  filters: "Filtres",
  filter: { unread: "Non lues", important: "Importantes", SCHEDULE: "Emploi du temps", REQUEST: "Demandes", ANNOUNCEMENT: "Annonces", DEADLINE: "Échéances" },
  unread: "Non lues : {n}", allRead: "Tout est lu", markAll: "Tout marquer comme lu", closeAnnouncement: "Fermer l’annonce",
  emptyUnread: "Aucune notification non lue", empty: "Rien pour l’instant",
  emptyText: "Les changements d’emploi du temps, le suivi des demandes et les annonces du décanat apparaîtront ici automatiquement.",
  kind: { SCHEDULE: "Emploi du temps", REQUEST: "Demande", ANNOUNCEMENT: "Annonce", DEADLINE: "Échéance", APPOINTMENT: "Rendez-vous", GRADE: "Note" },
  important: "important", notRead: "Non lue",
};
export default notifications;
