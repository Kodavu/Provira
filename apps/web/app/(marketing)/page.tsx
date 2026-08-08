import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Check,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Glow,
  GridPattern,
  Section,
  SectionHeading,
} from "@/components/marketing/ui";
import { CountUp, Marquee, Reveal, RevealGroup, RevealItem } from "@/components/marketing/motion";
import { HeroSwitcher } from "@/components/marketing/hero-switcher";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FaqSegmented } from "@/components/marketing/faq-segmented";
import { Testimonials } from "@/components/marketing/testimonials";
import { PosSpotlight } from "@/components/marketing/pos-spotlight";
import { Roadmap } from "@/components/marketing/roadmap";
import { Integrations } from "@/components/marketing/integrations";
import { LanguageShowcase } from "@/components/marketing/language-showcase";
import { PERSONAS } from "@/components/marketing/personas";

export const metadata = {
  title: "Provira — One platform for workers, employers & traders",
  description:
    "Provira connects Nigeria's informal economy: workers find jobs and get paid same-day, employers hire verified talent and pay on confirmation, and traders build records that unlock credit — with a full business toolkit coming soon.",
};

// Numeric config for the stats counters; the labels/subs come from the catalog.
const STAT_NUMBERS = [
  { to: 100, suffix: "%" },
  { to: 24, prefix: "< ", suffix: "h" },
  { to: 774, suffix: "" },
  { to: 3, suffix: "-in-1" },
];

const PARTNERS = ["CBN-licensed bank", "Squad Payments", "NDPR compliant", "NIBSS", "WhatsApp Business", "USSD *347*82#"];

export default async function HomePage() {
  const t = await getTranslations("Home");
  const tp = await getTranslations("Personas");
  const stats = t.raw("stats.items") as { label: string; sub: string }[];
  const escrowChips = t.raw("features.escrowChips") as string[];

  return (
    <>
      {/* ---------------- Interactive hero (3 personas) ---------------- */}
      <HeroSwitcher />

      {/* ---------------- Trust marquee ---------------- */}
      <section className="border-y border-line bg-canvas/60 py-8">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-ink-muted">
          {t("marquee.title")}
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
          eyebrow={t("ecosystem.eyebrow")}
          title={t("ecosystem.title")}
          subtitle={t("ecosystem.subtitle")}
        />
        <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3">
          {PERSONAS.map((p) => {
            const features = tp.raw(`${p.id}.features`) as string[];
            return (
              <RevealItem key={p.id}>
                <div
                  id={p.id === "worker" ? "workers" : p.id === "employer" ? "employers" : "traders"}
                  className="group relative flex h-full scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-xl text-white ${p.accent.iconBox}`}>
                    <p.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <p className="mt-5 text-xl font-semibold text-ink">{tp(`${p.id}.label`)}</p>
                  <p className="mt-1 text-sm font-medium text-ink-muted">{tp(`${p.id}.tagline`)}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {features.slice(0, 4).map((f) => (
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
                    {tp(`${p.id}.hero.primaryCta`)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Section>

      {/* ---------------- Platform value (feature bento) ---------------- */}
      <section className="border-y border-line bg-canvas/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("features.eyebrow")}
            title={t("features.title")}
            subtitle={t("features.subtitle")}
          />
          <RevealGroup className="mt-12 grid gap-4 md:grid-cols-6">
            <RevealItem className="md:col-span-4">
              <div className="relative h-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white shadow-card">
                <GridPattern className="text-white/10" />
                <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/15"><Wallet className="h-5 w-5" /></span>
                <h3 className="relative mt-5 text-2xl font-bold">{t("features.escrowTitle")}</h3>
                <p className="relative mt-2 max-w-md text-white/80">{t("features.escrowBody")}</p>
                <div className="relative mt-6 flex flex-wrap gap-2 text-sm">
                  {escrowChips.map((c) => (
                    <span key={c} className="rounded-full bg-white/15 px-3 py-1 font-medium">{c}</span>
                  ))}
                </div>
              </div>
            </RevealItem>

            <RevealItem className="md:col-span-2">
              <FeatureCard icon={TrendingUp} title={t("features.scoreTitle")} body={t("features.scoreBody")} tint="gold" />
            </RevealItem>
            <RevealItem className="md:col-span-2">
              <FeatureCard icon={MapPin} title={t("features.locationTitle")} body={t("features.locationBody")} tint="emerald" />
            </RevealItem>
            <RevealItem className="md:col-span-2">
              <FeatureCard icon={ShieldCheck} title={t("features.verifiedTitle")} body={t("features.verifiedBody")} tint="emerald" />
            </RevealItem>
            <RevealItem className="md:col-span-2">
              <FeatureCard icon={Phone} title={t("features.phoneTitle")} body={t("features.phoneBody")} tint="brand" />
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Multilingual (built for Nigeria) ---------------- */}
      <LanguageShowcase />

      {/* ---------------- How it works (tabbed by persona) ---------------- */}
      <Section id="how" className="py-20 md:py-28">
        <SectionHeading eyebrow={t("how.eyebrow")} title={t("how.title")} />
        <div className="mt-12">
          <HowItWorks />
        </div>
      </Section>

      {/* ---------------- Trader / POS spotlight ---------------- */}
      <PosSpotlight />

      {/* ---------------- Roadmap ---------------- */}
      <Roadmap />

      {/* ---------------- Stats ---------------- */}
      <section className="border-y border-line bg-brand-900/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_NUMBERS.map((s, i) => (
              <RevealItem key={i} className="text-center">
                <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                  <CountUp to={s.to} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{stats[i].label}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{stats[i].sub}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Integrations ---------------- */}
      <Integrations />

      {/* ---------------- Testimonials ---------------- */}
      <Section className="py-20 md:py-28">
        <SectionHeading eyebrow={t("testimonials.eyebrow")} title={t("testimonials.title")} subtitle={t("testimonials.subtitle")} />
        <div className="mt-12">
          <Testimonials />
        </div>
      </Section>

      {/* ---------------- FAQ (segmented by audience) ---------------- */}
      <section id="faq" className="scroll-mt-24 border-t border-line bg-canvas/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow={t("faq.eyebrow")} title={t("faq.title")} subtitle={t("faq.subtitle")} />
          <div className="mt-10">
            <FaqSegmented />
          </div>
          <p className="mt-8 text-center text-sm text-ink-soft">
            {t("faq.stillCurious")}{" "}
            <Link href="/help" className="font-semibold text-brand-700 hover:text-brand-800">{t("faq.helpCenter")}</Link> {t("faq.or")}{" "}
            <Link href="/contact" className="font-semibold text-brand-700 hover:text-brand-800">{t("faq.talkToUs")}</Link>.
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
                {t("finalCta.title")}
              </h2>
              <p className="mt-4 text-lg text-white/85">{t("finalCta.body")}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50">
                  {t("finalCta.primary")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
                  <MessageSquare className="h-4 w-4" /> {t("finalCta.secondary")}
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/70">{t("finalCta.note")}</p>
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
