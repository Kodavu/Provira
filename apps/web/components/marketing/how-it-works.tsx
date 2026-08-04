"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PersonaTabs } from "./persona-tabs";
import { PERSONA_MAP, type PersonaId } from "./personas";

const EASE = [0.22, 1, 0.36, 1] as const;

// How it works, told three ways. One tabbed section so each audience sees the
// path that's actually theirs — never a generic, worker-only flow.
export function HowItWorks() {
  const [active, setActive] = useState<PersonaId>("worker");
  const reduce = useReducedMotion();
  const persona = PERSONA_MAP[active];
  const a = persona.accent;

  return (
    <div>
      <PersonaTabs active={active} onChange={setActive} label="How it works, by audience" />

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="relative mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3"
        >
          {/* connecting line */}
          <div aria-hidden className={`absolute left-[16%] right-[16%] top-6 hidden h-px md:block ${a.bar} opacity-30`} />
          {persona.steps.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-4 border-canvas text-white ${a.iconBox}`}>
                <s.icon className="h-5 w-5" strokeWidth={1.9} />
              </div>
              <span className={`mt-3 inline-block text-xs font-bold uppercase tracking-widest ${a.softText}`}>Step {i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-ink-soft">{s.body}</p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
