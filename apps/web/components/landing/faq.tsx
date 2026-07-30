"use client";

import { useState } from "react";

const ITEMS = [
  {
    q: "What does Tally cost?",
    a: "Signing up and finding work is free for workers. Employers pay a small fee per completed job; traders pay nothing to log sales. No monthly charges.",
  },
  {
    q: "Do I need a smartphone?",
    a: "No. You can sign up, accept jobs, and confirm attendance over SMS, WhatsApp, or a phone call. A smartphone is optional, not required.",
  },
  {
    q: "How is my payment kept safe?",
    a: "Employers fund an escrow account before work begins. The money is held with a CBN-licensed partner and only released to you once attendance is confirmed with a 4-digit code.",
  },
  {
    q: "Which languages does Tally support?",
    a: "English, Nigerian Pidgin, Yorùbá, Hausa, and Igbo — across web, WhatsApp, SMS, and voice.",
  },
  {
    q: "What happens if there's a dispute?",
    a: "Either side can raise a dispute with evidence, including the attendance code log. Our team reviews it with a 48-hour service-level target before any pay moves.",
  },
  {
    q: "What do you do with my data?",
    a: "Your work record is yours. We only share a verifiable score with lenders you choose to apply to, and we follow Nigeria's NDPR. We never sell your data.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium text-ink">{item.q}</span>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
