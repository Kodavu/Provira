"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How fast do workers actually get paid?",
    a: "Same day. The moment attendance is confirmed with the employer's 4-digit code, the escrowed pay is released to the worker's Tally wallet and can be withdrawn to their bank — no waiting days for an invoice.",
  },
  {
    q: "Do I need a smartphone to use Tally?",
    a: "No. Tally is built phone-first: you can sign up, confirm shifts, and check your balance over USSD (*347*82#) or WhatsApp. A smartphone unlocks the full app, but it's never required.",
  },
  {
    q: "How does the Tally Score work?",
    a: "Every completed job, on-time arrival, logged sale, and repaid loan adds to your score. No-shows and disputes subtract. It's an honest, verifiable record that banks and lenders can check — which is what turns your work into real credit.",
  },
  {
    q: "How is my money protected?",
    a: "Employer funds are held in escrow with a CBN-licensed partner bank and only released on confirmed attendance. Payouts run through a licensed payment provider, and sensitive identifiers like your NIN are stored encrypted, never in the clear.",
  },
  {
    q: "What does it cost?",
    a: "Signing up, getting paid, and building your score are free for workers and traders. Employers pay a small, transparent fee per completed hire — with no monthly minimums.",
  },
  {
    q: "Is Tally available across Nigeria?",
    a: "We're rolling out state by state, starting in Lagos. Workers and employers anywhere in Nigeria can sign up now and set their location down to the ward, so we match you the moment jobs go live near you.",
  },
];

export function Faq() {
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
