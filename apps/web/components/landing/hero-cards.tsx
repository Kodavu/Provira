"use client";

import { motion, useReducedMotion } from "framer-motion";

// The right-column card stack — real UI as hero art. Three promises Guild makes
// in paragraphs, made here in DOM: an escrow-secured job, a same-day payment,
// and the Provira Score. Staggers in once; the escrow badge pulses once.
export function HeroCardStack() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.1 },
    },
  };
  const item = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
      };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3"
    >
      {/* Job card with escrow badge */}
      <motion.div variants={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">Bricklaying · 2 days</span>
          <motion.span
            initial={reduce ? undefined : { scale: 1 }}
            animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
            transition={reduce ? undefined : { duration: 0.6, delay: 0.9 }}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
            ₦28,000 secured
          </motion.span>
        </div>
        <p className="text-sm text-ink-muted">Yaba, Lagos · starts tomorrow</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            Adekunle Ltd · verified
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-success" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-brand-600">Apply →</span>
        </div>
      </motion.div>

      {/* Payment card */}
      <motion.div variants={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Payment received</span>
          <span className="text-sm font-semibold text-ink">₦13,000</span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">Paid 4 hrs after confirmation</p>
      </motion.div>

      {/* Provira Score card — the one place gold appears in the hero */}
      <motion.div variants={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div>
          <span className="text-xs text-ink-muted">Provira Score</span>
          <p className="mt-0.5 flex items-center gap-2 text-2xl font-bold text-ink">
            540
            <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
              Emerging
            </span>
          </p>
        </div>
        <svg width="52" height="32" viewBox="0 0 44 28" aria-hidden="true">
          <g stroke="#f5b301" strokeWidth={3} strokeLinecap="round">
            <line x1="6" y1="4" x2="6" y2="24" />
            <line x1="15" y1="4" x2="15" y2="24" />
            <line x1="24" y1="4" x2="24" y2="24" />
            <line x1="33" y1="4" x2="33" y2="24" />
            <line x1="2" y1="20" x2="40" y2="8" />
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
