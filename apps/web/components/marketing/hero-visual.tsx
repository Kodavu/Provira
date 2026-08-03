"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Wallet } from "lucide-react";
import { Float } from "./motion";

// A premium, self-contained product mockup for the hero: a phone-style app
// surface (score ring + activity) with floating glass cards. Pure CSS/SVG — no
// image assets — so it's crisp at any resolution and cheap to render.
export function HeroVisual() {
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay } }
      : { initial: { opacity: 0, y: 24, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] } };

  const pct = 62;
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Glow behind the device */}
      <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-gradient-to-tr from-brand-400/30 via-brand-200/20 to-gold-200/30 blur-3xl" />

      {/* Device */}
      <motion.div
        {...enter(0.05)}
        className="relative overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-brand-900/10 ring-1 ring-black/5"
      >
        {/* top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">T</span>
            <span className="text-sm font-bold text-ink">tally</span>
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">Worker</span>
        </div>

        {/* Score ring */}
        <div className="mt-5 rounded-2xl border border-line bg-canvas/60 p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 128 128" className="-rotate-90">
                <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <motion.circle
                  cx="64" cy="64" r={r} fill="none" stroke="#3d3bf3" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={c}
                  initial={{ strokeDashoffset: c }}
                  animate={{ strokeDashoffset: c - (pct / 100) * c }}
                  transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tracking-tight text-ink">540</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-gold-700">Emerging</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Tally Score</p>
              <p className="mt-1 text-sm leading-snug text-ink-soft">Next tier in <span className="font-semibold text-ink">60 pts</span></p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <motion.div className="h-full rounded-full bg-brand-500" initial={{ width: 0 }} animate={{ width: "62%" }} transition={{ delay: 0.7, duration: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Activity rows */}
        <div className="mt-4 space-y-2.5">
          {[
            { t: "Warehouse loading", s: "Confirmed · paid", v: "+₦8,000", up: true },
            { t: "Shop cleaning", s: "In progress", v: "₦6,000", up: false },
          ].map((row) => (
            <div key={row.t} className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{row.t}</p>
                <p className="text-[11px] text-ink-muted">{row.s}</p>
              </div>
              <span className={`text-sm font-semibold ${row.up ? "text-gold-700" : "text-ink-soft"}`}>{row.v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating card: payout */}
      <motion.div {...enter(0.35)} className="absolute -left-6 top-24 hidden sm:block">
        <Float amplitude={10} duration={5}>
          <div className="w-48 rounded-2xl border border-line bg-white/90 p-4 shadow-xl shadow-slate-900/10 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-50 text-gold-700"><Wallet className="h-4 w-4" /></span>
              <span className="text-xs font-semibold text-ink">Same-day payout</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink">₦14,000</p>
            <p className="text-[11px] text-ink-muted">Sent to your bank</p>
          </div>
        </Float>
      </motion.div>

      {/* Floating card: verified */}
      <motion.div {...enter(0.5)} className="absolute -right-4 bottom-16 hidden sm:block">
        <Float amplitude={12} duration={6} delay={0.5}>
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-success/10 text-success"><BadgeCheck className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-semibold text-ink">Attendance confirmed</p>
              <p className="text-[11px] text-ink-muted">Escrow released</p>
            </div>
          </div>
        </Float>
      </motion.div>

      {/* Floating chip: loan unlocked */}
      <motion.div {...enter(0.62)} className="absolute -right-2 -top-3 hidden lg:block">
        <Float amplitude={8} duration={4.5} delay={0.2}>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-brand-600/30">
            <ArrowUpRight className="h-3.5 w-3.5" /> Loan unlocked
          </div>
        </Float>
      </motion.div>
    </div>
  );
}
