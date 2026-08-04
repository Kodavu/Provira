"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { PersonaTabs } from "./persona-tabs";
import { PERSONA_MAP, type PersonaId } from "./personas";

const EASE = [0.22, 1, 0.36, 1] as const;

// FAQ organised by audience — each group answers the questions that group
// actually asks, instead of one generic list.
export function FaqSegmented() {
  const [active, setActive] = useState<PersonaId>("worker");
  const [open, setOpen] = useState<number | null>(0);
  const tp = useTranslations("Personas");
  const persona = PERSONA_MAP[active];
  const faqs = tp.raw(`${active}.faqs`) as { q: string; a: string }[];

  const pick = (id: PersonaId) => {
    setActive(id);
    setOpen(0);
  };

  return (
    <div>
      <PersonaTabs active={active} onChange={pick} label="FAQ by audience" />

      <div className="mx-auto mt-10 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-[15px] font-semibold text-ink">{f.q}</span>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${isOpen ? persona.accent.softBg + " " + persona.accent.softText + " border-transparent" : "border-line text-ink-muted"}`}>
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: EASE }}
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
    </div>
  );
}
