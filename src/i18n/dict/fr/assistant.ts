import type { Shape } from "@/i18n/core";
import type ru from "../ru/assistant";

const assistant: Shape<typeof ru> = {
  title: "Assistant du décanat",
  modeLlm: "GigaChat · ",
  modeOffline: "Mode recherche dans le Règlement · ",
  subtitle: "répond d’après le Règlement et vos données, en citant les articles. Ne voit que vos données.",
  offlineLang: "Le mode hors ligne (sans IA) répond en russe.",
  hello: "Bonjour, {name} ! Posez vos questions sur les attestations, la session, l’emploi du temps ou le règlement — ou demandez-moi de préparer une demande.",
  suggest: {
    s1: "Où en suis-je pour la session ?",
    s2: "Quelle attestation pour un visa pour l’Espagne ?",
    s3: "Comment obtenir une validation automatique ?",
    s4: "J’ai besoin d’une attestation pour le bureau militaire",
    s5: "Puis-je reporter un examen à cause d’une olympiade ?",
    s6: "Quand le bureau des étudiants reçoit-il ?",
  },
  sources: "Règlement :",
  point: "art. {id}",
  fill: "Remplir : {title}",
  offlineAnswer: "Réponse tirée du Règlement sans IA (en russe)",
  typing: "L’assistant écrit",
  inputLabel: "Votre question",
  placeholder: "Par exemple : quelle attestation pour le bureau militaire ?",
  send: "Envoyer",
  disclaimer: "L’assistant peut se tromper — vérifiez dans le Règlement. Il n’envoie jamais de demande lui-même : vous vérifiez le formulaire et l’envoyez.",
  errors: {
    generic: "Erreur",
    network: "Pas de connexion au serveur. Vérifiez votre connexion et réessayez.",
    badRequest: "Requête invalide",
    tooMany: "Trop de questions en une heure. Réessayez plus tard ou prenez rendez-vous au bureau des étudiants.",
  },
};
export default assistant;
