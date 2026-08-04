import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

// next-intl WITHOUT locale routing: the active language is read from the
// `tally-lang` cookie the language selector already sets, so every existing
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

export default getRequestConfig(async () => {
  const cookieValue = cookies().get("tally-lang")?.value ?? "EN";
  const locale = COOKIE_TO_LOCALE[cookieValue] ?? DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
