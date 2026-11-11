import type { Shape } from "@/i18n/core";
import type ru from "../ru/auth";

const auth: Shape<typeof ru> = {
  login: {
    title: "Sign in",
    about: "About the service",
    kicker: "The digital dean’s office of the future",
    heroTitle: "All your studies in one place, just a few taps away",
    heroText: "Student account: timetable, grades, certificates and contact with the dean’s office.",
    heading: "Sign in to your account",
    subtitle: "Students and dean’s office staff — with login and password.",
    reset: "Demo data has been recreated. Please sign in again.",
    forgot: "Forgot your password? Get a new one at the Student Office (room 1012, Building A) with your student ID.",
    login: "Login",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signingIn: "Signing in…",
    signIn: "Sign in",
    demoTitle: "Demo access for the jury",
    demoText: "Fictional accounts. Click to fill in the login and password.",
    demoStudent: "{name}, {faculty}, year {course}",
    demoWithExtra: "{base}, {extra}",
    demoMilitary: "military training",
    demoOdintsovo: "Odintsovo",
    demoStaff: "{name}, dean’s office",
  },
  errors: {
    enterLogin: "Enter your login",
    enterPassword: "Enter your password",
    invalid: "Incorrect login or password",
    invalidLeft: "Incorrect login or password. Attempts left: {n}",
    tooMany: "Too many failed attempts. Wait 15 minutes and try again.",
  },
  pages: {
    verify: {
      title: "Document verification",
      valid: "The document is authentic",
      revoked: "The document has been revoked",
      expired: "The document has expired",
      document: "Document",
      number: "Number",
      issued: "Issued",
      validUntil: "Valid until",
      student: "Student",
      notFound: "Document not found",
      notFoundText: "Check the link or QR code. If you received the document from a student, ask for a new one.",
    },
    notFound: {
      title: "Page not found",
      text: "This page does not exist or you do not have access to it. Check the address or go back to the home page.",
      home: "Go to home page",
    },
    offline: {
      title: "Offline",
      heading: "No internet connection",
      text: "Your account will open as soon as the connection is back. We do not store personal data on the device — it is safer on a shared computer.",
    },
    error: {
      title: "Something went wrong",
      text: "We could not load this section. Your data is safe — try again in a couple of seconds.",
      retry: "Try again",
    },
  },
};
export default auth;
