import type { Shape } from "@/i18n/core";
import type ru from "../ru/electives";

const electives: Shape<typeof ru> = {
  "title": "Cours à option",
  "tab": "Cours à option",
  "subtitle": "Semestre de printemps 2027 · cours inter-facultés",
  "window": {
    "open": "Inscriptions ouvertes jusqu’au {date}",
    "openLeft": {"one": "encore {n} jour", "other": "encore {n} jours"},
    "closed": "Inscriptions closes le {date}. Pour changer votre choix, adressez une demande au bureau pédagogique.",
    "soon": "Ouverture des inscriptions le {date}"
  },
  "rules": {
    "title": "Comment ça marche",
    "r1": "Vous pouvez choisir jusqu’à {n} cours.",
    "r2": "S’il reste des places, vous êtes inscrit tout de suite ; sinon, vous rejoignez la liste d’attente.",
    "r3": "Si quelqu’un se désiste, le premier de la liste d’attente est inscrit automatiquement et prévenu."
  },
  "mine": "{n} sur {max} choisis",
  "seats": "{taken} places sur {capacity}",
  "free": {
    "one": "{n} place restante",
    "other": "{n} places restantes"
  },
  "full": "complet",
  "waiting": "en liste d’attente : {n}",
  "credits": "{n} crédits",
  "status": {
    "ENROLLED": "Vous êtes inscrit",
    "WAITLIST": "Vous êtes n° {pos} sur la liste d’attente"
  },
  "actions": {
    "enroll": "S’inscrire",
    "waitlist": "Rejoindre la liste d’attente",
    "drop": "Se désister",
    "dropConfirm": {
      "title": "Se désister de ce cours ?",
      "body": "Votre place ira au premier de la liste d’attente. Vous ne pourrez la reprendre que si des places se libèrent.",
      "ok": "Oui, me désister"
    }
  },
  "done": {
    "ENROLLED": "Vous êtes inscrit au cours",
    "WAITLIST": "Vous êtes sur la liste d’attente — nous vous préviendrons si une place se libère",
    "drop": "Vous vous êtes désisté du cours"
  },
  "errors": {
    "closed": "Les inscriptions aux cours à option sont closes",
    "course": "Ce cours est réservé aux années supérieures",
    "limit": "Deux cours maximum — désistez-vous d’abord d’un cours",
    "exists": "Vous avez déjà choisi ce cours",
    "notFound": "Cours introuvable",
    "notChosen": "Vous n’êtes pas inscrit à ce cours"
  },
  "slot": "{day}, {time} · salle {room}",
  "fromCourse": "à partir de la {n}e année"
};
export default electives;
