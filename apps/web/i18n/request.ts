import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { cookies } from "next/headers";
import enMessages from "../messages/en.json";

// next-intl WITHOUT locale routing: the active language is read from the
// `truvo-lang` cookie the language selector already sets, so every existing
// route is preserved (no `/en`, `/yo` URL prefixes). Reading the cookie makes
// pages render per-request; that's the expected trade-off for cookie-based i18n.

export const LOCALES = ["en", "pcm", "yo", "ha", "ig"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Cookie stores our channel-wide codes (EN/PCM/YO/HA/IG); map to message files.
const COOKIE_TO_LOCALE: Record<string, Locale> = {
  EN: "en",
  PCM: "pcm",
  YO: "yo",
  HA: "ha",
  IG: "ig",
};

// Deep-merge a locale's (possibly partial) catalog over English so any key a
// translator hasn't filled in yet falls back to the English source string.
function mergeFallback(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      out[key] = mergeFallback(baseValue as Record<string, unknown>, value as Record<string, unknown>);
    } else if (value !== undefined && value !== "") {
      out[key] = value;
    }
  }
  return out;
}

export default getRequestConfig(async () => {
  const cookieValue = cookies().get("truvo-lang")?.value ?? "EN";
  const locale = COOKIE_TO_LOCALE[cookieValue] ?? DEFAULT_LOCALE;

  const localeMessages =
    locale === "en" ? enMessages : (await import(`../messages/${locale}.json`)).default;

  // Arrays (used for lists via `t.raw`) are valid at runtime but not modelled by
  // next-intl's message type, so cast the merged result.
  const messages = mergeFallback(
    enMessages as unknown as Record<string, unknown>,
    localeMessages as unknown as Record<string, unknown>,
  ) as AbstractIntlMessages;

  return { locale, messages };
});
