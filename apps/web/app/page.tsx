import Link from "next/link";
import { TallyMark, Wordmark } from "@/components/ui";
import { LandingNav } from "@/components/landing/nav";
import { HeroCardStack } from "@/components/landing/hero-cards";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Faq } from "@/components/landing/faq";
import { Newsletter } from "@/components/landing/newsletter";
import { LanguageSwitcher } from "@/components/landing/lang-switcher";

const ROLES = [
  {
    id: "workers",
    name: "Workers",
    body: "Find jobs near you. Get paid the day you work.",
    role: "worker",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  },
  {
    id: "employers",
    name: "Employers",
    body: "Hire verified workers. Pay only when work is confirmed.",
    role: "employer",
    icon: "M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm5 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  },
  {
    id: "traders",
    name: "Traders",
    body: "Count every sale. Unlock stock loans.",
    role: "trader",
    icon: "M6 6h15l-2 9H8L6 6Zm0 0-.8-3H3M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  },
];

const METRICS = [
  { label: "Workers paid", value: "—", caption: "Live once we launch." },
  { label: "Moved in escrow", value: "—", caption: "Held with a partner bank." },
  { label: "Payout speed", value: "Same day", caption: "On confirmed attendance." },
  { label: "Dispute SLA", value: "48 hrs", caption: "Reviewed, both sides." },
];

export default function LandingPage() {
  return (
    <main className="bg-white">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <h1 className="text-[2rem] font-bold leading-[1.12] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
            Work. Get paid today. Build your record.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Tally counts every job and every sale, pays you the same day, and
            turns your work history into credit you can actually use.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-700"
            >
              Get started free
            </Link>
            <a
              href="#how"
              className="rounded-xl border border-slate-300 px-6 py-3 text-base font-semibold text-ink hover:bg-canvas"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 font-mono text-sm text-ink-muted">
            No smartphone? Dial *347*82# or WhatsApp us.
          </p>
        </div>

        <HeroCardStack />
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-200 bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 opacity-70">
            {["Payment partner", "NDPR compliant", "CBN-licensed bank"].map((t) => (
              <span key={t} className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                {t}
              </span>
            ))}
          </div>
          <p className="text-sm text-ink-soft">
            Payments held in escrow with a CBN-licensed partner.
          </p>
        </div>
      </section>

      {/* Three doors */}
      <section id="roles" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Pick your door</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <Link
              key={r.id}
              id={r.id}
              href={`/login?role=${r.role}`}
              className="group scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-400"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
                  <path d={r.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="mt-4 text-lg font-semibold text-ink">{r.name}</p>
              <p className="mt-1 text-ink-soft">{r.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                Get started
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y border-slate-200 bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            How it works
          </h2>
          <HowItWorks />
        </div>
      </section>

      {/* Tally Score */}
      <section id="score" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-700">
              The Tally Score
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Your work, counted into credit.
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                "Every completed job and sale adds a stroke to your score.",
                "No-shows and disputes subtract — the record is honest.",
                "Banks and lenders can verify it, so it opens real credit.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-ink-soft">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8">
            <p className="text-sm text-ink-muted">Tally Score</p>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-6xl font-bold tracking-tight text-ink">540</span>
              <span className="mb-2 rounded-full bg-gold-50 px-3 py-1 text-sm font-semibold text-gold-700">
                Emerging
              </span>
            </div>
            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gold-50 p-5">
              <TallyMark boxed={false} className="h-14 w-14 text-gold-500" />
              <p className="text-sm text-ink-soft">
                Four strokes and a fifth — your record, drawn as you work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="border-y border-slate-200 bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-3xl font-bold tracking-tight text-ink">{m.value}</p>
              <p className="mt-1 text-sm font-medium text-ink">{m.label}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{m.caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Questions, answered
        </h2>
        <Faq />
      </section>

      {/* Final CTA */}
      <section className="bg-brand-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start counting your work today.
          </h2>
          <Link
            href="/login"
            className="rounded-xl bg-white px-7 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <Wordmark />
              <p className="mt-3 max-w-xs text-sm text-ink-soft">
                Economic identity for Nigeria&apos;s informal economy.
              </p>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-ink">Get launch updates</p>
                <div className="max-w-sm">
                  <Newsletter />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                { h: "Product", items: ["How it works", "For workers", "For employers", "Traders"] },
                { h: "Company", items: ["About", "Careers", "Contact"] },
                { h: "Legal", items: ["Privacy (NDPR)", "Terms", "Security"] },
              ].map((col) => (
                <div key={col.h}>
                  <p className="text-sm font-semibold text-ink">{col.h}</p>
                  <ul className="mt-3 space-y-2">
                    {col.items.map((it) => (
                      <li key={it}>
                        <span className="text-sm text-ink-soft">{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
            <p className="text-sm text-ink-muted">© {new Date().getFullYear()} Tally. All rights reserved.</p>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </main>
  );
}
