import { Sparkles, Target, HeartHandshake, Compass, Users, Building2, MapPin } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/ui";
import { Reveal, RevealGroup, RevealItem, CountUp } from "@/components/marketing/motion";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "About Tally — Building economic identity for the informal economy",
  description:
    "Tally exists to give Nigeria's informal workers, employers, and traders a verifiable economic identity — turning everyday work into pay, trust, and credit.",
};

const VALUES = [
  { icon: Target, title: "Dignity first", body: "The informal economy powers Nigeria. We build for its people as customers, never an afterthought." },
  { icon: HeartHandshake, title: "Trust by design", body: "Escrow, verified identities, and honest records mean both sides of a job can rely on us — and each other." },
  { icon: Compass, title: "Access over gatekeeping", body: "USSD, WhatsApp, and low-data flows so a smartphone is never the price of admission to earning." },
  { icon: Sparkles, title: "Earn it, own it", body: "Your record belongs to you. It follows you across jobs, sales, and lenders — a real, portable identity." },
];

const STATS = [
  { to: 65, suffix: "%", label: "of Nigeria's workforce is informal" },
  { to: 774, suffix: "", label: "LGAs we're building to reach" },
  { display: "∞", label: "invisible work — until now" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={<><Sparkles className="h-3.5 w-3.5" /> Our mission</>}
        title="Turning everyday work into economic identity"
        lede="Millions of Nigerians work hard every single day, yet a lifetime of effort leaves no paper trail a bank can trust. Tally changes that — one job, one sale, one confirmed shift at a time."
      />

      {/* Story */}
      <Section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Why we exist"
              title="The economy runs on work that stays invisible"
            />
            <div className="mt-6 space-y-4 text-ink-soft">
              <p>
                The market trader who restocks at dawn, the crew that loads a warehouse overnight, the cleaner who
                never misses a shift — they keep the country moving. But when they need capital, a fair wage on time,
                or simply proof of what they&apos;ve done, the system has nothing to show.
              </p>
              <p>
                Tally gives that work a memory. Every completed job, logged sale, and on-time repayment becomes part of
                a verifiable record — the <strong className="font-semibold text-ink">Tally Score</strong> — that
                employers, banks, and lenders can actually check. Work becomes reputation. Reputation becomes credit.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users, k: "For workers", v: "Same-day pay and a record that opens real credit." },
                { icon: Building2, k: "For employers", v: "Hire verified people; pay only on confirmed work." },
                { icon: MapPin, k: "Ward-level reach", v: "Matching that works down to your neighbourhood." },
                { icon: HeartHandshake, k: "For traders", v: "Log sales, build history, unlock stock advances." },
              ].map((c) => (
                <div key={c.k} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <c.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-ink">{c.k}</p>
                  <p className="mt-1 text-sm text-ink-soft">{c.v}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Stats band */}
      <section className="border-y border-line bg-canvas/50">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <RevealGroup className="grid gap-6 sm:grid-cols-3">
            {STATS.map((s) => (
              <RevealItem key={s.label} className="text-center">
                <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                  {s.display ?? <CountUp to={s.to!} suffix={s.suffix ?? ""} />}
                </p>
                <p className="mx-auto mt-2 max-w-[16rem] text-sm text-ink-soft">{s.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Values */}
      <Section className="py-16 md:py-24">
        <SectionHeading eyebrow="What we believe" title="The principles behind every decision" />
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <RevealItem key={v.title}>
              <div className="flex h-full gap-4 rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
                  <v.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{v.body}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <CtaBand
        title="Help us make work count"
        body="Whether you're here to earn, to hire, or to build with us — there's a place for you at Tally."
        secondary={{ label: "See open roles", href: "/careers" }}
      />
    </>
  );
}
