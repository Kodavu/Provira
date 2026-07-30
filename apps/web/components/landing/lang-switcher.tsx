"use client";

import { useState } from "react";

const LANGS = ["English", "Pidgin", "Yorùbá", "Hausa", "Igbo"];

// Presentational for now — marketing copy isn't localized yet, but the control
// sits where users expect it (top-right of the footer).
export function LanguageSwitcher() {
  const [lang, setLang] = useState("English");
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" strokeLinecap="round" />
      </svg>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Language"
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-brand-500"
      >
        {LANGS.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
    </label>
  );
}
