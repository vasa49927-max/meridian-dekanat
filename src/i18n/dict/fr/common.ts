import type { Shape } from "@/i18n/core";
import type ru from "../ru/common";

const common: Shape<typeof ru> = {
  brand: "Meridian",
  tagline: "décanat numérique",
  brandHome: "Meridian — accueil",
  disclaimerStrong: "Concept pour le concours IA du MGIMO.",
  disclaimerRest: "Ce n’est pas un service officiel du MGIMO. Toutes les personnes et données sont fictives.",
  nav: {
    sections: "Rubriques", mainSections: "Rubriques principales", today: "Aujourd’hui", schedule: "Emploi du temps", grades: "Résultats", requests: "Demandes et attestations",
    requestsShort: "Demandes", notifications: "Notifications", assistant: "Assistant", appointments: "Rendez-vous", profile: "Profil", more: "Plus",
    unreadCount: { one: "{n} non lue", other: "{n} non lues" },
    staffQueue: "File des demandes", staffAnnouncements: "Annonces", staffLessons: "Changements de cours", staffReception: "Accueil des étudiants", staffDemo: "Données de démo",
    hasUnread: "Vous avez des notifications non lues", skip: "Aller au contenu", logout: "Se déconnecter", studentRole: "{course}e année · étudiant",
  },
  top: { search: "Recherche et actions", searchAria: "Recherche et actions (Ctrl+K)", notifications: "Notifications", notificationsUnread: "Notifications : {n} non lues" },
  theme: { dark: "Thème sombre", light: "Thème clair", toDark: "Passer au thème sombre", toLight: "Passer au thème clair" },
  offline: "Hors ligne. Dernière version chargée affichée — les actions seront disponibles au retour de la connexion.",
  loading: "Chargement…", loadingAria: "Chargement",
  confirm: { yes: "Oui", keep: "Non, garder", back: "Non, revenir" },
  actions: { back: "Retour", next: "Suivant", save: "Enregistrer", saving: "Enregistrement…", cancel: "Annuler", close: "Fermer", all: "Tout", more: "Détails", retry: "Réessayer", showMore: "Afficher plus" },
  avatar: "Avatar : {name}",
  status: { SUBMITTED: "Envoyée", IN_PROGRESS: "En cours", NEEDS_INFO: "À compléter", READY: "Prête", ISSUED: "Remise", REJECTED: "Refusée" },
  lessonType: { LECTURE: "Cours magistral", SEMINAR: "TD", PRACTICE: "TP", LANGUAGE: "Langue étrangère", MILITARY: "Formation militaire", CONSULTATION: "Permanence", EXAM: "Examen", CREDIT: "Validation" },
  control: { EXAM: "Examen", CREDIT: "Validation", GRADED_CREDIT: "Contrôle noté" },
  lang: { label: "Langue", note: "Les messages du décanat s’affichent dans leur langue d’origine." },
  tour: {
    step: "Astuce {i} sur {n}", welcome: "bienvenue, {name}", close: "Fermer les astuces", start: "Compris, c’est parti", reopen: "Astuces",
    s1t: "L’essentiel est sur « Aujourd’hui »", s1: "Votre prochain cours avec la salle et le compte à rebours, et juste en dessous les changements de la semaine. Plus besoin de fouiller le chat du groupe.",
    s2t: "« Résultats » vous dit par où commencer", s2: "Vos points, ce qu’il manque pour la note automatique et le prochain devoir. Le calculateur « et si » est dans chaque carte.",
    s3t: "Des attestations sans file d’attente", s3: "« Demandes » → choisissez un document → un formulaire d’une minute. Le statut s’affiche ici, et l’attestation arrive avec un QR code de vérification.",
    s4t: "Recherche et assistant", s4: "Ctrl+K (ou la loupe en haut) mène partout. L’« Assistant » répond selon le règlement et peut préremplir une demande — c’est vous qui l’envoyez.",
  },
  palette: {
    label: "Rechercher", placeholder: "Rubrique, matière, attestation, action…", empty: "Aucun résultat. Essayez de demander à l’", emptyAssistant: "assistant",
    quick: "Actions rapides", order: "Demander : {title}", book: "Prendre rendez-vous", ask: "Demander à l’assistant", calendar: "Emploi du temps dans le calendrier",
    sections: "Rubriques", theme: "Changer de thème", myCourses: "Mes matières", myRequests: "Mes demandes", lastRequests: "Demandes récentes",
    hintNav: "↑↓ choisir, Entrée ouvrir", hintEsc: "Échap fermer",
  },
};
export default common;
