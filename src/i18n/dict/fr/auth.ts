import type { Shape } from "@/i18n/core";
import type ru from "../ru/auth";

const auth: Shape<typeof ru> = {
  login: {
    title: "Connexion",
    about: "À propos du service",
    kicker: "Le décanat numérique de demain",
    heroTitle: "Toutes vos études au même endroit, en quelques gestes",
    heroText: "Espace étudiant : emploi du temps, notes, attestations et lien avec le décanat.",
    heading: "Connexion à votre espace",
    subtitle: "Étudiants et personnel du décanat — avec identifiant et mot de passe.",
    reset: "Les données de démonstration ont été recréées. Reconnectez-vous.",
    forgot: "Mot de passe oublié ? Un nouveau vous est remis au bureau des étudiants (salle 1012, bâtiment A) sur présentation de la carte d’étudiant.",
    login: "Identifiant",
    password: "Mot de passe",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    signingIn: "Connexion…",
    signIn: "Se connecter",
    demoTitle: "Accès de démonstration pour le jury",
    demoText: "Comptes fictifs. Cliquez pour remplir l’identifiant et le mot de passe.",
    demoStudent: "{name}, {faculty}, {course}e année",
    demoWithExtra: "{base}, {extra}",
    demoMilitary: "formation militaire",
    demoOdintsovo: "Odintsovo",
    demoStaff: "{name}, décanat",
  },
  errors: {
    enterLogin: "Saisissez votre identifiant",
    enterPassword: "Saisissez votre mot de passe",
    invalid: "Identifiant ou mot de passe incorrect",
    invalidLeft: "Identifiant ou mot de passe incorrect. Tentatives restantes : {n}",
    tooMany: "Trop de tentatives échouées. Attendez 15 minutes et réessayez.",
  },
  pages: {
    verify: {
      title: "Vérification du document",
      valid: "Document authentique",
      revoked: "Document annulé",
      expired: "Document expiré",
      document: "Document",
      number: "Numéro",
      issued: "Délivré le",
      validUntil: "Valable jusqu’au",
      student: "Étudiant",
      notFound: "Document introuvable",
      notFoundText: "Vérifiez le lien ou le QR code. Si vous avez reçu le document d’un étudiant, demandez-en un nouveau.",
    },
    notFound: {
      title: "Page introuvable",
      text: "Cette page n’existe pas ou vous n’y avez pas accès. Vérifiez l’adresse ou revenez à l’accueil.",
      home: "Retour à l’accueil",
    },
    offline: {
      title: "Hors ligne",
      heading: "Pas de connexion Internet",
      text: "Votre espace s’ouvrira dès le retour de la connexion. Nous ne stockons pas de données personnelles sur l’appareil — c’est plus sûr sur un ordinateur partagé.",
    },
    error: {
      title: "Un problème est survenu",
      text: "Impossible de charger cette section. Vos données sont en sécurité — réessayez dans quelques secondes.",
      retry: "Réessayer",
    },
  },
};
export default auth;
