import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Clock,
  Fingerprint,
  Landmark,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Eyebrow,
  Glow,
  GridPattern,
  PrimaryCta,
  SecondaryCta,
  Section,
  SectionHeading,
  LinkArrow,
} from "@/components/marketing/ui";
import { CountUp, Marquee, Reveal, RevealGroup, RevealItem } from "@/components/marketing/motion";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { Testimonials } from "@/components/marketing/testimonials";
import { Faq } from "@/components/marketing/faq";

export const metadata = {
  title: "Tally — Get paid today. Build your economic identity.",
  description:
    "Tally turns informal work, sales, and payments into a verifiable record — same-day pay, better jobs, and real credit for Nigeria's informal economy.",
};

const AUDIENCES = [
  { id: "workers", name: "Workers", body: "Find jobs near you and get paid the same day you work.", role: "worker", icon: Users },
  { id: "employers", name: "Employers", body: "Hire verified workers. Fund escrow and pay only on confirmation.", role: "employer", icon: Briefcase },
  { id: "traders", name: "Traders", body: "Log every sale, build a record, and unlock stock loans.", role: "trader", icon: Store },
];

const STEPS = [
  { icon: Fingerprint, title: "Create your identity", body: "Sign up with a phone number. Add your skills and location — no smartphone required." },
  { icon: Briefcase, title: "Work or hire", body: "Workers apply to nearby jobs; employers invite verified people and fund escrow up front." },
  { icon: Wallet, title: "Get paid & grow", body: "Confirm attendance with a code, get paid same-day, and watch your score unlock credit." },
];

const STATS = [
  { to: 100, suffix: "%", label: "Of pay held in escrow", sub: "Released only on confirmed work" },
  { to: 24, prefix: "< ", suffix: "h", label: "To same-day payout", sub: "From confirmation to your bank" },
  { to: 774, suffix: "", label: "LGAs supported", sub: "Match jobs down to your ward" },
  { to: 48, suffix: "h", label: "Dispute SLA", sub: "Reviewed fairly, both sides" },
];

const PARTNERS = ["CBN-licensed bank", "Squad Payments", "NDPR compliant", "NIBSS", "WhatsApp Business", "USSD *347*82#"];

export default function HomePage() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <GridPattern className="text-slate-200" />
        <Glow className="-left-40 -top-40 h-[36rem] w-[36rem] opacity-40" from="#a3a3f8" to="#fbdd8f" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <Reveal>
              <Eyebrow>
                <Sparkles className="h-3.5 w-3.5" /> Economic identity for the informal economy
              </Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Work. Get paid today.{" "}
                <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                  Build your record.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-soft">
                Tally counts every job and every sale, pays you the same day, and turns your work
                history into credit you can actually use — for workers, employers, and traders.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PrimaryCta href="/signup" size="lg">
                  Get started free <ArrowRight className="h-4 w-4" />
                </PrimaryCta>
                <SecondaryCta href="/#how" size="lg">
                  See how it works
                </SecondaryCta>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-muted">
                <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-success" /> No card required</span>
                <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4 text-brand-500" /> Works without a smartphone</span>
                <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-ink-muted" /> Escrow-protected</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} y={30}>
            <HeroVisual />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Partner / trust marquee ---------------- */}
      <section className="border-y border-line bg-canvas/60 py-8">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Built on trusted, licensed infrastructure
        </p>
        <Marquee speed={30} className="mx-auto max-w-6xl px-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {PARTNERS.map((p) => (
            <span key={p} className="whitespace-nowrap text-lg font-semibold text-ink-muted/70">
              {p}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ---------------- Audiences ---------------- */}
      <Section id="roles" className="py-20 md:py-28">
        <SectionHeading
          eyebrow="One platform, three doors"
          title="Whoever you are, Tally counts your work"
          subtitle="A shared economic identity that follows you across jobs, sales, and lenders."
        />
        <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <RevealItem key={a.id}>
              <Link
                id={a.id}
                href={`/signup?type=${a.role}`}
                className="group relative block h-full scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl"
              >
                <div aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-50 opacity-0 transition group-hover:opacity-100" />
                <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                  <a.icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <p className="relative mt-5 text-xl font-semibold text-ink">{a.name}</p>
                <p className="relative mt-2 text-ink-soft">{a.body}</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                  Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ---------------- Feature bento ---------------- */}
      <Section className="py-20 md:py-28">
        <SectionHeading
          eyebrow="Why Tally"
          title="Everything you need to turn work into wealth"
          subtitle="Payments, reputation, matching, and credit — designed for how the informal economy actually works."
        />
        <RevealGroup className="mt-12 grid gap-4 md:grid-cols-6">
          {/* Big: same-day pay */}
          <RevealItem className="md:col-span-4">
            <div className="relative h-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white shadow-card">
              <GridPattern className="text-white/10" />
              <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/15"><Wallet className="h-5 w-5" /></span>
              <h3 className="relative mt-5 text-2xl font-bold">Same-day pay, held safely in escrow</h3>
              <p className="relative mt-2 max-w-md text-white/80">
                Employers fund the job up front. The moment attendance is confirmed, workers are paid —
                straight to their bank, the same day. No invoices, no chasing.
              </p>
              <div className="relative mt-6 flex flex-wrap gap-2 text-sm">
                {["Escrow-backed", "Instant release", "Bank payout"].map((t) => (
                  <span key={t} className="rounded-full bg-white/15 px-3 py-1 font-medium">{t}</span>
                ))}
              </div>
            </div>
          </RevealItem>

          <RevealItem className="md:col-span-2">
            <FeatureCard icon={TrendingUp} title="The Tally Score" body="A verifiable reputation built from real work — the key that unlocks credit." tint="gold" />
          </RevealItem>

          <RevealItem className="md:col-span-2">
            <FeatureCard icon={MapPin} title="Match by location" body="Down to the ward. Workers see jobs near them; employers reach the right people fast." />
          </RevealItem>

          <RevealItem className="md:col-span-2">
            <FeatureCard icon={ShieldCheck} title="Verified & trusted" body="NIN-verified identities and confirmed track records on both sides of every job." />
          </RevealItem>

          <RevealItem className="md:col-span-2">
            <FeatureCard icon={Phone} title="Phone-first access" body="Full USSD and WhatsApp support so no smartphone is ever a barrier to earning." />
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="scroll-mt-24 border-y border-line bg-canvas/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="How it works" title="From first shift to real credit in three steps" />
          <RevealGroup className="relative mt-14 grid gap-8 md:grid-cols-3">
            {/* connecting line */}
            <div aria-hidden className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200 md:block" />
            {STEPS.map((s, i) => (
              <RevealItem key={s.title} className="relative text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border-4 border-canvas bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                  <s.icon className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-brand-600">Step {i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-ink-soft">{s.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Tally Score showcase ---------------- */}
      <Section id="score" className="py-20 md:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <Eyebrow><TrendingUp className="h-3.5 w-3.5" /> The Tally Score</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Your work, counted into credit</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              For millions of hard-working Nigerians, a lifetime of work leaves no paper trail. Tally
              changes that — every job, sale, and on-time repayment becomes a verifiable signal a bank can trust.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: BadgeCheck, t: "Every completed job and sale adds to your score." },
                { icon: Clock, t: "Show up on time, repay on time — the record rewards reliability." },
                { icon: Landmark, t: "Lenders can verify it, so it opens real, affordable credit." },
              ].map((row) => (
                <li key={row.t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                    <row.icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="text-ink-soft">{row.t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <LinkArrow href="/signup">Start building your score</LinkArrow>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative">
              <Glow className="inset-6 opacity-30" from="#7b79f5" to="#fbdd8f" />
              <div className="relative rounded-3xl border border-line bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-muted">Tally Score</p>
                  <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">Emerging</span>
                </div>
                <p className="mt-2 text-6xl font-bold tracking-tight text-ink">540</p>
                <div className="mt-6 space-y-3">
                  {[
                    { label: "Jobs completed", val: "48", pct: 80 },
                    { label: "On-time rate", val: "94%", pct: 94 },
                    { label: "Loans repaid", val: "3 / 3", pct: 100 },
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-ink-soft">{r.label}</span>
                        <span className="font-semibold text-ink">{r.val}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-gold-50 p-4">
                  <Banknote className="h-6 w-6 shrink-0 text-gold-700" />
                  <p className="text-sm text-ink-soft">Score 540 unlocks a <span className="font-semibold text-ink">₦50,000</span> stock advance.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------------- Stats ---------------- */}
      <section className="border-y border-line bg-brand-900/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <RevealItem key={s.label} className="text-center">
                <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                  <CountUp to={s.to} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{s.label}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{s.sub}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <Section className="py-20 md:py-28">
        <SectionHeading eyebrow="Testimonials" title="Real work. Real pay. Real trust." />
        <div className="mt-12">
          <Testimonials />
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="scroll-mt-24 border-t border-line bg-canvas/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" subtitle="Everything you need to know before you get started." />
          <div className="mt-10">
            <Faq />
          </div>
          <p className="mt-8 text-center text-sm text-ink-soft">
            Still curious? <Link href="/help" className="font-semibold text-brand-700 hover:text-brand-800">Visit the Help Center</Link> or{" "}
            <Link href="/contact" className="font-semibold text-brand-700 hover:text-brand-800">talk to us</Link>.
          </p>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <Section className="pb-24 pt-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 px-6 py-16 text-center shadow-2xl shadow-brand-900/20 sm:px-12">
            <GridPattern className="text-white/10" />
            <Glow className="-right-20 -top-20 h-72 w-72 opacity-30" from="#fbdd8f" to="#a3a3f8" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Start counting your work today
              </h2>
              <p className="mt-4 text-lg text-white/85">
                Join the workers, employers, and traders building a verifiable economic identity — and getting paid faster for it.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
                  <MessageSquare className="h-4 w-4" /> Talk to us
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/70">No smartphone? Dial <span className="font-semibold text-white">*347*82#</span> or message us on WhatsApp.</p>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  tint = "brand",
}: {
  icon: typeof Wallet;
  title: string;
  body: string;
  tint?: "brand" | "gold";
}) {
  return (
    <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint === "gold" ? "bg-gold-50 text-gold-700" : "bg-brand-50 text-brand-600"}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
