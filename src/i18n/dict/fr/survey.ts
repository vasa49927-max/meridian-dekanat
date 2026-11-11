import type { Shape } from "@/i18n/core";
import type ru from "../ru/survey";

const survey: Shape<typeof ru> = {
  "title": "Évaluation des cours",
  "subtitle": "Anonyme : le décanat ne voit que les moyennes, et seulement à partir de trois réponses",
  "how": {
    "title": "Comment l’anonymat est protégé",
    "p1": "Votre réponse est enregistrée sans votre nom ni l’heure — seulement la date.",
    "p2": "Une marque chiffrée « déjà répondu », stockée à part, empêche de voter deux fois. Elle ne peut pas être reliée à votre réponse.",
    "p3": "Le décanat ne voit les résultats d’un cours qu’à partir de trois réponses."
  },
  "q": {
    "clarity": "Le cours est-il expliqué clairement",
    "teacher": "Comment évaluez-vous le travail de l’enseignant",
    "workload": "La charge de travail est-elle raisonnable",
    "comment": "Que faudrait-il améliorer (facultatif)",
    "commentHint": "N’indiquez ni noms ni détails permettant de vous identifier."
  },
  "scale": {
    "low": "mauvais",
    "high": "excellent",
    "aria": "{q} : {n} sur 5"
  },
  "send": "Envoyer anonymement",
  "sending": "Envoi…",
  "done": "Merci ! Votre réponse a été enregistrée anonymement.",
  "voted": "Vous avez déjà répondu",
  "left": {
    "one": "Il reste {n} cours à évaluer",
    "other": "Il reste {n} cours à évaluer"
  },
  "allDone": "Vous avez évalué tous les cours du semestre — merci !",
  "empty": "Aucun cours à évaluer ce semestre.",
  "banner": {
    "text": "Évaluez les cours du semestre — anonymement, 1 minute par cours.",
    "cta": "Répondre"
  },
  "errors": {
    "fill": "Répondez aux trois questions",
    "already": "Vous avez déjà répondu pour ce cours",
    "notFound": "Cours introuvable"
  }
};
export default survey;
