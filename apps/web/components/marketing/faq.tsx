"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

const FAQ_KEYS = [
  "speed",
  "smartphone",
  "score",
  "protection",
  "cost",
  "availability",
  "languages",
  "changeLang",
  "notifications",
  "ugc",
] as const;

export function Faq() {
  const t = useTranslations("Faq");
  const FAQS = FAQ_KEYS.map((k) => ({ q: t(`items.${k}.q`), a: t(`items.${k}.a`) }));
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-[15px] font-semibold text-ink">{f.q}</span>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${isOpen ? "border-brand-200 bg-brand-50 text-brand-600" : "border-line text-ink-muted"}`}>
                {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
