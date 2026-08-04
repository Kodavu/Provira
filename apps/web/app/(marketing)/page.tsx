import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  Clock,
  Landmark,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Eyebrow,
  Glow,
  GridPattern,
  Section,
  SectionHeading,
  LinkArrow,
} from "@/components/marketing/ui";
import { CountUp, Marquee, Reveal, RevealGroup, RevealItem } from "@/components/marketing/motion";
import { HeroSwitcher } from "@/components/marketing/hero-switcher";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FaqSegmented } from "@/components/marketing/faq-segmented";
import { Testimonials } from "@/components/marketing/testimonials";
import { PosSpotlight } from "@/components/marketing/pos-spotlight";
import { Roadmap } from "@/components/marketing/roadmap";
import { Integrations } from "@/components/marketing/integrations";
import { PERSONAS } from "@/components/marketing/personas";

export const metadata = {
  title: "Tally — One platform for workers, employers & traders",
  description:
    "Tally connects Nigeria's informal economy: workers find jobs and get paid same-day, employers hire verified talent and pay on confirmation, and traders build records that unlock credit — with a full business toolkit coming soon.",
};

const STATS = [
  { to: 100, suffix: "%", label: "Of pay held in escrow", sub: "Released only on confirmed work" },
  { to: 24, prefix: "< ", suffix: "h", label: "To same-day payout", sub: "From confirmation to your bank" },
  { to: 774, suffix: "", label: "LGAs supported", sub: "Match down to your ward" },
  { to: 3, suffix: "-in-1", label: "Workers, employers, traders", sub: "One connected identity" },
];

const PARTNERS = ["CBN-licensed bank", "Squad Payments", "NDPR compliant", "NIBSS", "WhatsApp Business", "USSD *347*82#"];

export default function HomePage() {
  return (
    <>
      {/* ---------------- Interactive hero (3 personas) ---------------- */}
      <HeroSwitcher />

      {/* ---------------- Trust marquee ---------------- */}
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

      {/* ---------------- One connected ecosystem ---------------- */}
      <Section id="ecosystem" className="py-20 md:py-28">
        <SectionHeading
          eyebrow="One connected ecosystem"
          title="Three audiences. One shared economic identity."
          subtitle="Workers, employers, and traders each get a product built for them — connected by the same verified identity, escrow, and Tally Score."
        />
        <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3">
          {PERSONAS.map((p) => (
            <RevealItem key={p.id}>
              <div
                id={p.id === "worker" ? "workers" : p.id === "employer" ? "employers" : "traders"}
                className="group relative flex h-full scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-xl text-white ${p.accent.iconBox}`}>
                  <p.icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <p className="mt-5 text-xl font-semibold text-ink">{p.label}</p>
                <p className="mt-1 text-sm font-medium text-ink-muted">{p.tagline}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${p.accent.softIcon}`}>
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.hero.primary.href}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition ${p.accent.solid}`}
                >
                  {p.hero.primary.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ---------------- Platform value (feature bento) ---------------- */}
      <section className="border-y border-line bg-canvas/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Why Tally"
            title="The rails that make it all work"
            subtitle="Payments, reputation, matching, and access — shared infrastructure that serves every side of the platform."
          />
          <RevealGroup className="mt-12 grid gap-4 md:grid-cols-6">
            <RevealItem className="md:col-span-4">
              <div className="relative h-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white shadow-card">
                <GridPattern className="text-white/10" />
                <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/15"><Wallet className="h-5 w-5" /></span>
                <h3 className="relative mt-5 text-2xl font-bold">Escrow-backed pay, released on confirmation</h3>
                <p className="relative mt-2 max-w-md text-white/80">
                  Employers fund jobs up front; workers are paid the same day their attendance is confirmed. No invoices,
                  no chasing, no paying for no-shows.
                </p>
                <div className="relative mt-6 flex flex-wrap gap-2 text-sm">
                  {["Escrow-backed", "Instant release", "Bank payout"].map((t) => (
                    <span key={t} className="rounded-full bg-white/15 px-3 py-1 font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </RevealItem>

            <RevealItem className="md:col-span-2">
              <FeatureCard icon={TrendingUp} title="The Tally Score" body="A verifiable reputation built from real work and sales — the key that unlocks credit." tint="gold" />
            </RevealItem>
            <RevealItem className="md:col-span-2">
              <FeatureCard icon={MapPin} title="Match by location" body="Down to the ward. The right jobs, workers, and customers, close to home." tint="emerald" />
            </RevealItem>
            <RevealItem className="md:col-span-2">
              <FeatureCard icon={ShieldCheck} title="Verified & trusted" body="NIN-verified identities and confirmed track records on every side of a deal." tint="emerald" />
            </RevealItem>
            <RevealItem className="md:col-span-2">
              <FeatureCard icon={Phone} title="Phone-first access" body="Full USSD and WhatsApp support so no smartphone is ever a barrier." tint="brand" />
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- How it works (tabbed by persona) ---------------- */}
      <Section id="how" className="py-20 md:py-28">
        <SectionHeading eyebrow="How it works" title="A clear path — for whoever you are" />
        <div className="mt-12">
          <HowItWorks />
        </div>
      </Section>

      {/* ---------------- Tally Score showcase ---------------- */}
      <section className="border-y border-line bg-canvas/60 py-20 md:py-28">
        <Section id="score" container>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <Eyebrow><TrendingUp className="h-3.5 w-3.5" /> The Tally Score</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Your work, counted into credit</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                For millions of hard-working Nigerians, a lifetime of work leaves no paper trail. Tally changes that —
                every job, sale, and on-time repayment becomes a verifiable signal a bank can trust.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: BadgeCheck, t: "Every completed job and logged sale adds to your score." },
                  { icon: Clock, t: "Show up on time, repay on time — reliability is rewarded." },
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
                      { label: "Jobs & sales", val: "48", pct: 80 },
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
                    <p className="text-sm text-ink-soft">Score 540 unlocks a <span className="font-semibold text-ink">₦50,000</span> advance.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Section>
      </section>

      {/* ---------------- Trader / POS spotlight ---------------- */}
      <PosSpotlight />

      {/* ---------------- Roadmap ---------------- */}
      <Roadmap />

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

      {/* ---------------- Integrations ---------------- */}
      <Integrations />

      {/* ---------------- Testimonials ---------------- */}
      <Section className="py-20 md:py-28">
        <SectionHeading eyebrow="Testimonials" title="Real work. Real pay. Real trust." subtitle="From every side of the platform." />
        <div className="mt-12">
          <Testimonials />
        </div>
      </Section>

      {/* ---------------- FAQ (segmented by audience) ---------------- */}
      <section id="faq" className="scroll-mt-24 border-t border-line bg-canvas/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" subtitle="Pick your audience for the answers that matter to you." />
          <div className="mt-10">
            <FaqSegmented />
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
                Whoever you are, start counting your work today
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
  tint?: "brand" | "gold" | "emerald";
}) {
  const tints: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    gold: "bg-gold-50 text-gold-700",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tints[tint]}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
