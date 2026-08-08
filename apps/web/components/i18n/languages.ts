"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Single source of truth for the languages Provira speaks at launch. The seed
// UI translations live in @provira/i18n; here we keep the presentation metadata
// plus a small preference hook that persists the visitor's choice.
export interface LanguageOption {
  code: "EN" | "PCM" | "YO" | "HA" | "IG";
  label: string; // English name
  native: string; // endonym shown in the selector
  flag: string; // 🇬🇧 for English, 🇳🇬 for the Nigerian languages
}

export const LANGUAGES: LanguageOption[] = [
  { code: "EN", label: "English", native: "English", flag: "🇬🇧" },
  { code: "PCM", label: "Nigerian Pidgin", native: "Pidgin", flag: "🇳🇬" },
  { code: "YO", label: "Yoruba", native: "Yorùbá", flag: "🇳🇬" },
  { code: "HA", label: "Hausa", native: "Hausa", flag: "🇳🇬" },
  { code: "IG", label: "Igbo", native: "Igbo", flag: "🇳🇬" },
];

export const STORAGE_KEY = "provira-lang";
export const ONBOARDED_KEY = "provira-lang-chosen";

export type LangCode = LanguageOption["code"];

/**
 * Persist the visitor's language preference to localStorage + a cookie so it
 * survives reloads and future sessions (and is readable server-side later).
 * The UI copy isn't fully localized yet — this stores the *preference* so the
 * control behaves correctly today and is ready for full i18n wiring.
 */
export function useLanguagePreference() {
  const [code, setCode] = useState<LangCode>("EN");
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (saved && LANGUAGES.some((l) => l.code === saved)) setCode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const choose = useCallback((next: LangCode) => {
    setCode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(ONBOARDED_KEY, "1");
      document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`;
    } catch {
      /* ignore */
    }
    // Re-render server components so next-intl serves the new locale's messages.
    router.refresh();
  }, [router]);

  return { code, choose };
}

export function currentLanguage(code: LangCode): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
