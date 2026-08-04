"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Wordmark } from "@/components/ui";
import { LanguageMenu } from "@/components/i18n/language-menu";

const HIGHLIGHT_ICONS = [TrendingUp, Wallet, ShieldCheck];

// Two-column auth shell: a branded gradient panel (desktop) beside the form.
// On mobile the panel collapses to a compact header so the form leads.
export function AuthLayout({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const t = useTranslations("Auth");
  const highlights = t.raw("highlights") as { title: string; body: string }[];

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-brand-700 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{ background: "radial-gradient(120% 120% at 0% 0%, #3d3bf3 0%, #2725b0 45%, #1f1e70 100%)" }}
        />
        {/* soft gold glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />

        <div className="relative z-10 p-10">
          <Wordmark className="[&_*]:!text-white" />
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 px-10 pb-16"
        >
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white">
            {t("headline")}
          </h2>
          <ul className="mt-8 space-y-5">
            {highlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[i] ?? TrendingUp;
              return (
                <motion.li
                  key={i}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3.5"
                >
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-500 ring-1 ring-white/15">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-medium text-white">{h.title}</p>
                    <p className="text-sm leading-relaxed text-white/70">{h.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      </aside>

      {/* Form column */}
      <main className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="lg:hidden">
            <Wordmark />
          </div>
          <div className="ml-auto">
            <LanguageMenu />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
