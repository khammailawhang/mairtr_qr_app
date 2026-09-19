import { FALLBACK_LANGUAGE } from "./constants";

export function getLocalizedField(record, field, lang, fallbackLang = FALLBACK_LANGUAGE) {
  const value = record?.[field];

  if (!value) return "";
  if (typeof value === "string") return value;

  return value[lang] ?? value[fallbackLang] ?? Object.values(value)[0] ?? "";
}
