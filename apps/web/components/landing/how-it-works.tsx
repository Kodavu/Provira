"use client";

import { motion, useReducedMotion } from "framer-motion";

const STEPS = [
  { n: 1, title: "Post a job", body: "Employer posts a shift and the pay." },
  { n: 2, title: "Escrow funded", body: "Money is secured before work starts." },
  { n: 3, title: "Work confirmed", body: "A 4-digit code confirms attendance." },
  { n: 4, title: "Paid same day", body: "Pay releases straight to the worker." },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      {/* Progress line (desktop) that draws in on scroll */}
      <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-slate-200 md:block">
        <motion.div
          className="h-full bg-brand-500"
          initial={{ scaleX: reduce ? 1 : 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduce ? 0 : 1, ease: "easeOut" }}
          style={{ originX: 0 }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : i * 0.12 }}
            className="relative"
          >
            <span className="relative z-10 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 font-semibold text-white">
              {s.n}
            </span>
            <p className="mt-4 font-semibold text-ink">{s.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
