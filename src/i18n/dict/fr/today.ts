import type { Shape } from "@/i18n/core";
import type ru from "../ru/today";

const today: Shape<typeof ru> = {
  greeting: { morning: "Bonjour, {name}", day: "Bon après-midi, {name}", evening: "Bonsoir, {name}", night: "Bonne nuit, {name}" },
  next: {
    teacher: "Enseignant", position: { docent: "Maître de conférences", prof: "Professeur", senior: "Chargé d’enseignement", lect: "Enseignant", colonel: "Colonel" },
    now: "En cours", next: "Prochain cours", left: "encore {time}", in: "dans {time}",
    day: "Jour", start: "Début", room: "Salle", until: "jusqu’à {time}", nearWeekday: "{near}, {weekday}",
    aria: "{label} : {title}, {weekday}, {date}, à {time}, salle {room}",
    moved: "Cours déplacé", usually: "habituellement : {text}", prev: "{day}, {time}, salle {room}", progress: "Temps écoulé du cours",
    noMore: "Plus de cours", noMoreText: "Le semestre est terminé ou les cours ne sont pas encore programmés. Le calendrier des examens est dans « Emploi du temps ».",
  },
  dur: {
    min: "{n} min", hm: "{h} h {m} min", h: "{n} h",
    days: { one: "{n} jour", other: "{n} jours" },
  },
  grades: {
    title: "Où en sont vos études", pace1: "des points possibles", pace2: "ce semestre",
    dayPoints: "Points des matières de ce jour", todayPoints: "Points des matières du jour",
    auto: "validé", risk: "risque", toAuto: "encore {n} pour valider", toAutoHint: "points manquants pour une validation automatique",
    autoDone: "Validations automatiques :", autoOf: "{n} sur {total}", avg: "Moyenne du relevé :", riskLabel: "Risque :", noRisk: "Aucun risque — continuez ainsi",
  },
  day: {
    week: "Semaine", tomorrow: "Demain, {date}",
    lessons: { one: "{n} cours", other: "{n} cours" },
    none: "pas de cours", nextDayNote: "Pas de cours aujourd’hui — voici le prochain jour de cours.",
    cancelled: "Cours annulé", roomChanged: "Désormais salle {room} (au lieu de {prev})", movedHere: "Déplacé ici · salle {room}",
    meta: "{type} · salle {room}, bât. {building}", empty: "Pas de cours aujourd’hui", nearest: "Prochain cours : {day} à {time}.",
  },
  ai: {
    title: "Assistant du décanat", text: "Répond selon le règlement et vos données, et peut remplir une demande.",
    label: "Question à l’assistant", placeholder: "Votre question au décanat", ask: "Demander",
  },
  deadlines: { workTitle: "{work} — {short}", workDesc: "{name} · jusqu’à {max} pts", title: "Échéances à venir", empty: "Aucune échéance en vue" },
  requests: { title: "Mes demandes", needsInfo: "répondez au décanat", ready: "ouvrez le document", due: "avant le {date}", empty: "Aucune demande en cours.", order: "Demander une attestation" },
  news: { title: "Annonces", important: "important", empty: "Aucune nouvelle annonce.", all: "Toutes les notifications" },
  more: {
    unread: { one: "{n} non lue", other: "{n} non lues" },
    allRead: "tout est lu", assistant: "Assistant du décanat", assistantHint: "L’IA répond selon le règlement et vos données",
    appointmentsHint: "sans file d’attente", profileHint: "données, langues, sessions",
  },
};
export default today;
