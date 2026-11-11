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
import campus from "./campus";
import survey from "./survey";
import portfolio from "./portfolio";

export const zh: Shape<Dict> = { common, auth, today, schedule, grades, requests, notifications, profile, appointments, assistant, campus, survey, portfolio };
