import { ShieldCheck, Lock, Landmark, KeyRound, Eye, ServerCog, FileCheck2, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section, SectionHeading } from "@/components/marketing/ui";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Security at Provira",
  description: "How Provira protects your money and your data: escrow with licensed partner banks, encrypted identifiers, least-privilege access, and NDPR-aligned practices.",
};

const PILLAR_ICONS = {
  escrow: Landmark,
  encryption: Lock,
  access: KeyRound,
  rails: ServerCog,
  fraud: Eye,
  ndpr: FileCheck2,
} as const;

const PILLAR_KEYS = ["escrow", "encryption", "access", "rails", "fraud", "ndpr"] as const;

export default async function SecurityPage() {
  const t = await getTranslations("Security");
  return (
    <>
      <PageHero
        eyebrow={<><ShieldCheck className="h-3.5 w-3.5" /> {t("eyebrow")}</>}
        title={t("title")}
        lede={t("lede")}
      />

      <Section className="py-16 md:py-24">
        <RevealGroup className="grid gap-4 md:grid-cols-3">
          {PILLAR_KEYS.map((key) => {
            const Icon = PILLAR_ICONS[key];
            return (
              <RevealItem key={key}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-ink">{t(`pillars.${key}.title`)}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t(`pillars.${key}.body`)}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Section>

      {/* Responsible disclosure */}
      <section className="border-y border-line bg-canvas/50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow={t("disclosureEyebrow")}
            title={t("disclosureTitle")}
            subtitle={t("disclosureSubtitle")}
          />
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-line bg-white p-6 text-center shadow-card">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gold-50 text-gold-700">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-sm text-ink-soft">
              {t.rich("disclosureBody", {
                email: (chunks) => (
                  <a href="mailto:security@provira.com.ng" className="font-semibold text-brand-700 hover:text-brand-800">{chunks}</a>
                ),
              })}
            </p>
          </div>
        </div>
      </section>

      <CtaBand title={t("ctaTitle")} body={t("ctaBody")} secondary={{ label: t("ctaSecondary"), href: "/privacy" }} />
    </>
  );
}
