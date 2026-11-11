import type { Locale } from "../config";
import { ru, type Dict } from "./ru";
import { en } from "./en";
import { zh } from "./zh";
import { fr } from "./fr";

export type { Dict };
export const DICTS: Record<Locale, Dict> = { ru, en: en as Dict, zh: zh as Dict, fr: fr as Dict };
