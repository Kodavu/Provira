"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BadgeCheck, Globe, Languages, MessageCircle, Wallet } from "lucide-react";
import { Eyebrow, Glow, GridPattern } from "./ui";
import { Reveal } from "./motion";
import { LANGUAGES, type LangCode } from "@/components/i18n/languages";

// Localized sample strings mirror the seed catalog in @tally/i18n (kept in the
// repo's tone-mark-free seed form, pending native-speaker review) so the demo is
// authentic rather than invented.
const DEMO: Record<LangCode, { title: string; sub: string; confirmed: string; pay: string; cta: string }> = {
  EN: { title: "Welcome to Tally", sub: "Find work near you", confirmed: "Attendance confirmed", pay: "Your payment is on the way", cta: "Find work" },
  PCM: { title: "Welcome to Tally", sub: "Find work wey dey near you", confirmed: "We don confirm say you show", pay: "Your money dey come", cta: "Find work" },
  YO: { title: "Kaabo si Tally", sub: "Wa ise nitosi re", confirmed: "A ti jerisi wiwa re", pay: "Owo re n bo", cta: "Wa ise" },
  HA: { title: "Barka da zuwa Tally", sub: "Nemo aiki kusa da kai", confirmed: "An tabbatar da kasancewarka", pay: "Kudin ka na zuwa", cta: "Nemo aiki" },
  IG: { title: "Nnoo na Tally", sub: "Choo oru di gi nso", confirmed: "Emeela ka odida gi", pay: "Ego gi na-abia", cta: "Choo oru" },
};

const ROTATE_MS = 2600;

export function LanguageShowcase() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const tr = useTranslations("Home");
  const bullets = tr.raw("language.bullets") as string[];
  const lang = LANGUAGES[i];
  const t = DEMO[lang.code];

  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % LANGUAGES.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [reduce, paused]);

  return (
    <section className="relative overflow-hidden border-y border-line bg-canvas/50 py-20 md:py-28">
      <GridPattern className="text-slate-200" />
      <Glow className="-right-32 -top-24 h-[28rem] w-[28rem] opacity-30" from="#a3a3f8" to="#fbdd8f" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        {/* Copy */}
        <Reveal>
          <Eyebrow><Languages className="h-3.5 w-3.5" /> {tr("language.eyebrow")}</Eyebrow>
          <h2 className="mt-5 text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {tr("language.title1")}{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">{tr("language.title2")}</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            {tr("language.sub")}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {LANGUAGES.map((l, idx) => (
              <button
                key={l.code}
                onClick={() => {
                  setI(idx);
                  setPaused(true);
                }}
                aria-pressed={idx === i}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                  idx === i ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-soft hover:border-brand-200"
                }`}
              >
                <span aria-hidden>{l.flag}</span> {l.native}
              </button>
            ))}
          </div>

          <ul className="mt-7 space-y-2.5 text-sm text-ink-soft">
            {bullets.map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Animated phone mockup */}
        <Reveal delay={0.1}>
          <div
            className="relative mx-auto w-full max-w-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-gradient-to-tr from-brand-400/25 via-brand-200/20 to-gold-200/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-brand-900/10 ring-1 ring-black/5">
              {/* header + live language pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">T</span>
                  <span className="text-sm font-bold text-ink">tally</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={lang.code}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700"
                  >
                    <Globe className="h-3 w-3" /> {lang.flag} {lang.native}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* greeting */}
              <div className="mt-5 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang.code}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="text-xl font-bold tracking-tight text-ink">{t.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{t.sub}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* CTA button (localized label) */}
              <div className="mt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang.code}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    {t.cta}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* confirmation toast */}
              <div className="mt-4 min-h-[3.25rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang.code}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: -12 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas/60 px-3 py-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success/10 text-success"><BadgeCheck className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{t.confirmed}</p>
                      <p className="flex items-center gap-1 truncate text-[11px] text-ink-muted"><Wallet className="h-3 w-3" /> {t.pay}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* USSD/WhatsApp note */}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
                <MessageCircle className="h-3 w-3" /> {tr("language.note")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
