import type { Shape } from "@/i18n/core";
import type ru from "../ru/portfolio";

const portfolio: Shape<typeof ru> = {
  "title": "Portfolio",
  "subtitle": "Vos réussites pendant les études — et un CV généré en un clic",
  "cv": "CV (PDF)",
  "kinds": {
    "OLYMPIAD": "Olympiade",
    "CONFERENCE": "Conférence",
    "INTERNSHIP": "Stage",
    "CERTIFICATE": "Certificat",
    "VOLUNTEER": "Bénévolat",
    "PUBLICATION": "Publication"
  },
  "verified": "Confirmé par le décanat",
  "unverified": "Ajouté par vous",
  "remove": "Supprimer",
  "removeAria": "Supprimer : {title}",
  "removeConfirm": {
    "title": "Supprimer cette entrée ?",
    "body": "Elle disparaîtra du portfolio et du CV.",
    "ok": "Supprimer"
  },
  "empty": {
    "title": "Votre portfolio est vide",
    "text": "Ajoutez olympiades, stages et certificats — votre CV sera construit à partir d’eux."
  },
  "add": {
    "title": "Ajouter une réussite",
    "kind": "Type",
    "name": "Intitulé",
    "namePlaceholder": "p. ex. Stage au service d’analyse",
    "org": "Organisation",
    "date": "Mois et année",
    "description": "Résultat en quelques mots",
    "submit": "Ajouter",
    "sending": "Enregistrement…",
    "done": "Ajouté au portfolio",
    "note": "Après vérification des documents, le décanat peut marquer l’entrée comme confirmée."
  },
  "errors": {
    "fill": "Remplissez les champs obligatoires",
    "title": "L’intitulé doit faire 3 à 200 caractères",
    "date": "Indiquez le mois et l’année",
    "limit": "Le portfolio est limité à 50 entrées"
  },
  "cvPage": {
    "title": "CV",
    "print": "Imprimer ou enregistrer en PDF",
    "back": "Retour au portfolio",
    "education": "Formation",
    "achievements": "Réussites",
    "languages": "Langues",
    "contacts": "Contacts",
    "student": "Étudiant{suffix} en {course}e année",
    "program": "{code} « {name} »",
    "avg": "Moyenne : {avg} sur 100",
    "since": "depuis {year}",
    "generated": "Généré dans l’espace Meridian",
    "verifiedMark": "✓ confirmé"
  }
};
export default portfolio;
