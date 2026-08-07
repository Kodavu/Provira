"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Globe, X } from "lucide-react";
import { LANGUAGES, ONBOARDED_KEY, useLanguagePreference, type LangCode } from "./languages";

// A gentle first-visit prompt: pick a language once, and Truvo remembers it.
// Shows a single time (guarded by localStorage) and is always dismissible.
export function LanguageOnboarding() {
  const { code, choose } = useLanguagePreference();
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) {
        const t = setTimeout(() => setShow(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const pick = (c: LangCode) => {
    choose(c);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-onboarding-title"
        >
          <button aria-label="Close" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={dismiss} />
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition hover:bg-canvas hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Globe className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 id="lang-onboarding-title" className="mt-4 text-xl font-bold tracking-tight text-ink">
              Choose your language
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Truvo works in the language you&apos;re most comfortable with. Pick one — you can change it any time.
            </p>

            <div className="mt-5 grid gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => pick(l.code)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:border-brand-300 hover:bg-canvas ${
                    l.code === code ? "border-brand-300 bg-brand-50/60" : "border-line"
                  }`}
                >
                  <span className="text-xl" aria-hidden>{l.flag}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-ink">{l.native}</span>
                    <span className="block text-xs text-ink-muted">{l.label}</span>
                  </span>
                </button>
              ))}
            </div>

            <button onClick={dismiss} className="mt-4 w-full text-center text-sm font-medium text-ink-muted transition hover:text-ink">
              Continue in English
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
