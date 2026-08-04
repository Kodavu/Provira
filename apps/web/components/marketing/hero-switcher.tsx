"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { GridPattern, Glow } from "./ui";
import { PersonaVisual } from "./persona-visual";
import { PERSONAS, type PersonaId } from "./personas";

const EASE = [0.22, 1, 0.36, 1] as const;

// The centrepiece: one hero that tells three stories. Switching the audience
// tab swaps the headline, copy, CTAs, feature list and product mockup with
// framer-motion transitions — so every visitor immediately sees themselves.
export function HeroSwitcher() {
  const [active, setActive] = useState<PersonaId>("worker");
  const reduce = useReducedMotion();
  const persona = PERSONAS.find((p) => p.id === active)!;
  const a = persona.accent;

  const swap = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -14 },
        transition: { duration: 0.4, ease: EASE },
      };

  return (
    <section className="relative overflow-hidden">
      <GridPattern className="text-slate-200" />
      <Glow className="-left-40 -top-40 h-[36rem] w-[36rem] opacity-40" from="#a3a3f8" to="#fbdd8f" />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-16">
        {/* Audience switcher */}
        <div className="mb-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Choose your audience"
            className="inline-flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-line bg-white/80 p-1.5 shadow-card backdrop-blur"
          >
            {PERSONAS.map((p) => {
              const isActive = p.id === active;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(p.id)}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="persona-pill"
                      className={`absolute inset-0 rounded-xl ${a.tabActive}`}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" strokeWidth={1.9} />
                  <span className="relative">For {p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          {/* Left: copy that changes per persona */}
          <div className="min-h-[24rem]">
            <AnimatePresence mode="wait">
              <motion.div key={persona.id} {...swap}>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${a.chip}`}>
                  <Sparkles className="h-3.5 w-3.5" /> {persona.tagline}
                </span>
                <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
                  {persona.hero.lead}{" "}
                  <span className={`bg-gradient-to-r ${a.gradText} bg-clip-text text-transparent`}>
                    {persona.hero.emphasis}
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink-soft">
                  {persona.hero.sub}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href={persona.hero.primary.href}
                    className={`group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition ${a.solid}`}
                  >
                    {persona.hero.primary.label}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href={persona.hero.secondary.href}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-base font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:bg-canvas"
                  >
                    {persona.hero.secondary.label}
                  </Link>
                </div>

                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                  {persona.hero.chips.map((chip) => (
                    <li key={chip.label} className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                      <span className={`grid h-5 w-5 place-items-center rounded-full ${a.softIcon}`}>
                        <chip.icon className="h-3 w-3" strokeWidth={2.2} />
                      </span>
                      {chip.label}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: product mockup that changes per persona */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={persona.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -12 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <PersonaVisual id={persona.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Shared trust line */}
        <p className="mt-14 text-center text-sm text-ink-muted">
          One connected ecosystem for Nigeria&apos;s informal economy — workers, employers, and traders.
        </p>
      </div>
    </section>
  );
}
