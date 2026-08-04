"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Banknote,
  Package,
  Receipt,
  Star,
  Wallet,
} from "lucide-react";
import { Float } from "./motion";
import type { PersonaId } from "./personas";

// Self-contained, animated product mockups — one per persona. Pure CSS/SVG so
// they stay crisp at any size and cost little to render. Reused in the hero and
// the product showcase.

const EASE = [0.22, 1, 0.36, 1] as const;

function useEnter() {
  const reduce = useReducedMotion();
  return (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay } }
      : {
          initial: { opacity: 0, y: 20, scale: 0.97 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { delay, duration: 0.6, ease: EASE },
        };
}

export function PersonaVisual({ id }: { id: PersonaId }) {
  if (id === "employer") return <EmployerVisual />;
  if (id === "trader") return <TraderVisual />;
  return <WorkerVisual />;
}

/* ------------------------------- Worker -------------------------------- */
function WorkerVisual() {
  const reduce = useReducedMotion();
  const enter = useEnter();
  const pct = 62;
  const r = 46;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-gradient-to-tr from-brand-400/30 via-brand-200/20 to-brand-100/30 blur-3xl" />
      <motion.div {...enter(0.05)} className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-brand-900/10 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">My work</span>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">Worker</span>
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-canvas/60 p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 112 112" className="-rotate-90">
                <circle cx="56" cy="56" r={r} fill="none" stroke="#e2e8f0" strokeWidth="11" />
                <motion.circle
                  cx="56" cy="56" r={r} fill="none" stroke="#3d3bf3" strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={c}
                  initial={{ strokeDashoffset: reduce ? c - (pct / 100) * c : c }}
                  animate={{ strokeDashoffset: c - (pct / 100) * c }}
                  transition={{ delay: 0.4, duration: 1.1, ease: EASE }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-ink">540</span>
                <span className="text-[9px] font-medium uppercase tracking-wide text-gold-700">Emerging</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Tally Score</p>
              <p className="mt-1 text-sm leading-snug text-ink-soft">Next tier in <span className="font-semibold text-ink">60 pts</span></p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <motion.div className="h-full rounded-full bg-brand-500" initial={{ width: reduce ? "62%" : 0 }} animate={{ width: "62%" }} transition={{ delay: 0.6, duration: 0.9 }} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { t: "Warehouse loading", s: "Confirmed · paid", v: "+₦8,000", up: true },
            { t: "Shop cleaning", s: "In progress", v: "₦6,000", up: false },
          ].map((row) => (
            <div key={row.t} className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{row.t}</p>
                <p className="text-[11px] text-ink-muted">{row.s}</p>
              </div>
              <span className={`text-sm font-semibold ${row.up ? "text-gold-700" : "text-ink-soft"}`}>{row.v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...enter(0.4)} className="absolute -right-4 bottom-14 hidden sm:block">
        <Float amplitude={10} duration={5}>
          <div className="w-44 rounded-2xl border border-line bg-white/90 p-4 shadow-xl shadow-slate-900/10 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-50 text-gold-700"><Wallet className="h-4 w-4" /></span>
              <span className="text-xs font-semibold text-ink">Same-day payout</span>
            </div>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">₦14,000</p>
            <p className="text-[11px] text-ink-muted">Sent to your bank</p>
          </div>
        </Float>
      </motion.div>
    </div>
  );
}

/* ------------------------------ Employer ------------------------------- */
function EmployerVisual() {
  const reduce = useReducedMotion();
  const enter = useEnter();
  const applicants = [
    { n: "Amaka O.", r: 4.9, v: true, s: "Confirmed" },
    { n: "Musa I.", r: 4.8, v: true, s: "Invited" },
    { n: "Grace E.", r: 4.7, v: true, s: "Applied" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-gradient-to-tr from-emerald-400/25 via-emerald-200/20 to-emerald-100/30 blur-3xl" />
      <motion.div {...enter(0.05)} className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-emerald-900/10 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Warehouse crew</p>
            <p className="text-[11px] text-ink-muted">Ikeja, Lagos · Night shift</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Hiring</span>
        </div>

        {/* headcount progress */}
        <div className="mt-4 rounded-2xl border border-line bg-canvas/60 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">Confirmed</span>
            <span className="font-semibold text-ink">3 / 5 hired</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: reduce ? "60%" : 0 }} animate={{ width: "60%" }} transition={{ delay: 0.5, duration: 1, ease: EASE }} />
          </div>
        </div>

        {/* applicants */}
        <div className="mt-3 space-y-2">
          {applicants.map((a, i) => (
            <motion.div
              key={a.n}
              initial={reduce ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.4, ease: EASE }}
              className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                  {a.n.split(" ").map((x) => x[0]).join("")}
                </span>
                <div>
                  <p className="flex items-center gap-1 text-sm font-medium text-ink">
                    {a.n} <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-ink-muted">
                    <Star className="h-3 w-3 fill-gold-500 text-gold-500" /> {a.r} · verified
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.s === "Confirmed" ? "bg-emerald-50 text-emerald-700" : a.s === "Invited" ? "bg-brand-50 text-brand-700" : "bg-canvas text-ink-soft"}`}>
                {a.s}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div {...enter(0.45)} className="absolute -left-5 bottom-16 hidden sm:block">
        <Float amplitude={10} duration={5.5}>
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><BadgeCheck className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-semibold text-ink">Escrow funded</p>
              <p className="text-[11px] text-ink-muted">₦75,000 held safely</p>
            </div>
          </div>
        </Float>
      </motion.div>
    </div>
  );
}

/* ------------------------------- Trader -------------------------------- */
function TraderVisual() {
  const reduce = useReducedMotion();
  const enter = useEnter();
  const bars = [40, 65, 52, 78, 60, 90, 72];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-gradient-to-tr from-gold-400/30 via-gold-200/20 to-gold-100/30 blur-3xl" />
      <motion.div {...enter(0.05)} className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-gold-700/10 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Today&apos;s sales</p>
            <p className="text-[11px] text-ink-muted">Mama Nkechi Stores</p>
          </div>
          <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-semibold text-gold-700">Trader</span>
        </div>

        <p className="mt-3 text-3xl font-bold tracking-tight text-ink">₦128,500</p>
        <p className="text-[11px] font-medium text-emerald-600">▲ 18% vs. yesterday</p>

        {/* mini bar chart */}
        <div className="mt-4 flex h-20 items-end gap-1.5 rounded-2xl border border-line bg-canvas/60 p-3">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t bg-gold-500"
              initial={reduce ? { height: `${h}%` } : { height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: EASE }}
            />
          ))}
        </div>

        {/* top products */}
        <div className="mt-3 space-y-2">
          {[
            { t: "Rice (50kg)", q: "12 sold", v: "₦54,000" },
            { t: "Cooking oil (5L)", q: "20 sold", v: "₦38,500" },
          ].map((p) => (
            <div key={p.t} className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-50 text-gold-700"><Receipt className="h-3.5 w-3.5" /></span>
                <div>
                  <p className="text-sm font-medium text-ink">{p.t}</p>
                  <p className="text-[11px] text-ink-muted">{p.q}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-ink">{p.v}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-gold-200 bg-gold-50/60 px-3 py-2">
          <Package className="h-4 w-4 text-gold-700" />
          <span className="text-[11px] font-medium text-gold-700">Full POS &amp; inventory · Coming soon</span>
        </div>
      </motion.div>

      <motion.div {...enter(0.5)} className="absolute -left-5 top-20 hidden sm:block">
        <Float amplitude={9} duration={5}>
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-50 text-gold-700"><Banknote className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-semibold text-ink">Stock loan unlocked</p>
              <p className="text-[11px] text-ink-muted">₦50,000 available</p>
            </div>
          </div>
        </Float>
      </motion.div>
    </div>
  );
}
