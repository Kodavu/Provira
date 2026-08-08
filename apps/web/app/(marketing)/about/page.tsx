import { Sparkles, Target, HeartHandshake, Compass, Users, Building2, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section, SectionHeading } from "@/components/marketing/ui";
import { Reveal, RevealGroup, RevealItem, CountUp } from "@/components/marketing/motion";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "About Provira — Building economic identity for the informal economy",
  description:
    "Provira exists to give Nigeria's informal workers, employers, and traders a verifiable economic identity — turning everyday work into pay, trust, and credit.",
};

const VALUE_META = [
  { id: "dignity", icon: Target },
  { id: "trust", icon: HeartHandshake },
  { id: "access", icon: Compass },
  { id: "own", icon: Sparkles },
];

const CARD_META = [
  { id: "workers", icon: Users },
  { id: "employers", icon: Building2 },
  { id: "ward", icon: MapPin },
  { id: "traders", icon: HeartHandshake },
];

export default async function AboutPage() {
  const t = await getTranslations("About");
  const STATS = [
    { to: 65, suffix: "%", label: t("stat1label") },
    { to: 774, suffix: "", label: t("stat2label") },
    { display: "∞", label: t("stat3label") },
  ];
  return (
    <>
      <PageHero
        eyebrow={<><Sparkles className="h-3.5 w-3.5" /> {t("heroEyebrow")}</>}
        title={t("heroTitle")}
        lede={t("heroLede")}
      />

      {/* Story */}
      <Section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow={t("whyEyebrow")}
              title={t("whyTitle")}
            />
            <div className="mt-6 space-y-4 text-ink-soft">
              <p>{t("storyP1")}</p>
              <p>
                {t.rich("storyP2", {
                  s: (chunks) => <strong className="font-semibold text-ink">{chunks}</strong>,
                })}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {CARD_META.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-ink">{t(`cards.${c.id}.k`)}</p>
                    <p className="mt-1 text-sm text-ink-soft">{t(`cards.${c.id}.v`)}</p>
                  </div>
                );
              })}
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
        <SectionHeading eyebrow={t("believeEyebrow")} title={t("believeTitle")} />
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
          {VALUE_META.map((v) => {
            const Icon = v.icon;
            return (
              <RevealItem key={v.id}>
                <div className="flex h-full gap-4 rounded-2xl border border-line bg-white p-6 shadow-card">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{t(`values.${v.id}.title`)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t(`values.${v.id}.body`)}</p>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Section>

      <CtaBand
        title={t("ctaTitle")}
        body={t("ctaBody")}
        secondary={{ label: t("ctaSecondary"), href: "/careers" }}
      />
    </>
  );
}
