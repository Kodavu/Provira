import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HelpCircle } from "lucide-react";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";
import { Faq } from "@/components/marketing/faq";

export const metadata = {
  title: "FAQ — Truvo",
  description: "Answers to common questions about pay, the Truvo Score, escrow, USSD access, fees, and availability across Nigeria.",
};

export default async function FaqPage() {
  const t = await getTranslations("Faq");
  return (
    <>
      <PageHero
        eyebrow={<><HelpCircle className="h-3.5 w-3.5" /> {t("heroEyebrow")}</>}
        title={t("heroTitle")}
        lede={t("heroLede")}
      />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Faq />
          <p className="mt-10 text-center text-sm text-ink-soft">
            {t.rich("cantFind", {
              help: (chunks) => <Link href="/help" className="font-semibold text-brand-700 hover:text-brand-800">{chunks}</Link>,
              contact: (chunks) => <Link href="/contact" className="font-semibold text-brand-700 hover:text-brand-800">{chunks}</Link>,
            })}
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
