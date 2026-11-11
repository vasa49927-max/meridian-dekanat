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

/** Русский словарь — источник истины: остальные языки обязаны повторять его форму (проверяет TypeScript). */
export const ru = { common, auth, today, schedule, grades, requests, notifications, profile, appointments, assistant, campus, survey, portfolio };
export type Dict = typeof ru;
