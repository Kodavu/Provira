"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { LANGUAGES, currentLanguage, useLanguagePreference } from "./languages";

// Compact language selector for the navbar and mobile menu. Persists the choice
// via the shared preference hook.
export function LanguageMenu({ align = "right" }: { align?: "left" | "right" }) {
  const { code, choose } = useLanguagePreference();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = currentLanguage(code);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose language"
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-brand-200 hover:text-ink"
      >
        <Globe className="h-4 w-4" strokeWidth={1.9} />
        <span aria-hidden>{current.flag}</span>
        <span className="hidden sm:inline">{current.native}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-xl shadow-slate-900/5 ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {LANGUAGES.map((l) => {
              const active = l.code === code;
              return (
                <li key={l.code}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      choose(l.code);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-canvas"
                  >
                    <span className="text-lg" aria-hidden>{l.flag}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{l.native}</span>
                      <span className="block text-xs text-ink-muted">{l.label}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-brand-600" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
