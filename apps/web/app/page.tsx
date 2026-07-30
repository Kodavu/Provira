import Link from "next/link";
import { Wordmark } from "@/components/ui";

const AUDIENCES = [
  {
    title: "Workers",
    body: "Find jobs nearby, get paid the same day, and build a reliability score — even without a smartphone, over SMS, WhatsApp, or a phone call.",
  },
  {
    title: "Traders",
    body: "Take card payments at your stall, auto-log every sale, and qualify for stock loans once you have a track record.",
  },
  {
    title: "Employers",
    body: "Post jobs, fund escrow up front, get matched with reliable workers, and release pay on a confirmed 4-digit attendance code.",
  },
];

export default function MarketingPage() {
  return (
    <main className="bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark />
        <Link
          href="/login"
          className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-20">
        <p className="mb-4 inline-block rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
          Economic identity for Nigeria&apos;s informal economy
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
          Turn everyday work into a record that{" "}
          <span className="text-brand-700">unlocks credit</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-soft">
          Tally turns informal work, sales, and payments into a verifiable
          reliability score — so workers get better jobs and same-day pay, and
          traders qualify for the loans that grow their business.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-brand-800 px-6 py-3 text-base font-semibold text-white hover:bg-brand-900"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line bg-surface px-6 py-3 text-base font-semibold text-ink hover:bg-canvas"
          >
            View a dashboard
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Works over web, WhatsApp, SMS, and phone calls — in English, Pidgin,
          Yoruba, Hausa, and Igbo.
        </p>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold text-brand-700">{a.title}</h3>
              <p className="mt-2 text-ink-soft">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-ink">How Tally works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["1. Sign up by phone", "No email, no smartphone required — just your number."],
            ["2. Work & get matched", "Employers fund escrow; we match you by skill, location, and language."],
            ["3. Confirm with a code", "A 4-digit code confirms attendance and releases your pay same-day."],
            ["4. Build your score", "Every completed job raises your reliability tier and unlocks loans."],
          ].map(([t, b]) => (
            <li key={t} className="rounded-2xl border border-line bg-brand-50/50 p-5">
              <div className="font-semibold text-brand-700">{t}</div>
              <div className="mt-1 text-sm text-ink-soft">{b}</div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-muted">
        Tally — building economic identity for the informal economy.
      </footer>
    </main>
  );
}
