import type { Dict } from "../ru";
import type { Shape } from "@/i18n/core";
import common from "./common";
import auth from "./auth";
import today from "./today";
import schedule from "./schedule";
import grades from "./grades";
import requests from "./requests";
import notifications from "./notifications";
import profile from "./profile";
import appointments from "./appointments";
import assistant from "./assistant";

export const en: Shape<Dict> = { common, auth, today, schedule, grades, requests, notifications, profile, appointments, assistant };
