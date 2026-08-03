import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";
import { Faq } from "@/components/marketing/faq";

export const metadata = {
  title: "FAQ — Tally",
  description: "Answers to common questions about pay, the Tally Score, escrow, USSD access, fees, and availability across Nigeria.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow={<><HelpCircle className="h-3.5 w-3.5" /> Frequently asked questions</>}
        title="Everything you need to know"
        lede="Still curious after reading? The Help Center goes deeper, or you can reach a human any time."
      />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Faq />
          <p className="mt-10 text-center text-sm text-ink-soft">
            Can&apos;t find your answer?{" "}
            <Link href="/help" className="font-semibold text-brand-700 hover:text-brand-800">Browse the Help Center</Link> or{" "}
            <Link href="/contact" className="font-semibold text-brand-700 hover:text-brand-800">contact us</Link>.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
