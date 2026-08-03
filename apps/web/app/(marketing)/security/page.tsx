import { ShieldCheck, Lock, Landmark, KeyRound, Eye, ServerCog, FileCheck2, AlertTriangle } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/ui";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Security at Tally",
  description: "How Tally protects your money and your data: escrow with licensed partner banks, encrypted identifiers, least-privilege access, and NDPR-aligned practices.",
};

const PILLARS = [
  { icon: Landmark, title: "Escrow-protected funds", body: "Employer funds are held with a CBN-licensed partner bank and released only when attendance is confirmed. No confirmation, no release." },
  { icon: Lock, title: "Encryption everywhere", body: "Traffic is protected with TLS in transit, and sensitive identifiers like your NIN are encrypted at rest — never stored in the clear." },
  { icon: KeyRound, title: "Least-privilege access", body: "Access to production data is role-based, logged, and limited to what each task strictly requires. No standing access to your records." },
  { icon: ServerCog, title: "Licensed payment rails", body: "Payouts run through licensed payment providers over regulated infrastructure — the same rails trusted by Nigerian banks." },
  { icon: Eye, title: "Fraud & anomaly checks", body: "Attendance codes, verified identities, and behavioural checks reduce no-shows, impersonation, and payout abuse on both sides." },
  { icon: FileCheck2, title: "NDPR-aligned by design", body: "We collect the minimum we need, tell you why, and honour your data rights under Nigeria's Data Protection Regulation." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow={<><ShieldCheck className="h-3.5 w-3.5" /> Trust & security</>}
        title="Your money and your data, protected"
        lede="Trust is the product. Here's exactly how we keep funds safe, identities private, and both sides of every job accountable."
      />

      <Section className="py-16 md:py-24">
        <RevealGroup className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <RevealItem key={p.title}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <p.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Responsible disclosure */}
      <section className="border-y border-line bg-canvas/50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Responsible disclosure"
            title="Found a vulnerability?"
            subtitle="We welcome reports from security researchers and treat them with priority."
          />
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-line bg-white p-6 text-center shadow-card">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gold-50 text-gold-700">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-sm text-ink-soft">
              Please email{" "}
              <a href="mailto:security@tally.ng" className="font-semibold text-brand-700 hover:text-brand-800">security@tally.ng</a>{" "}
              with details and steps to reproduce. Give us a reasonable window to fix the issue before public disclosure — and please don&apos;t access or modify data that isn&apos;t yours.
            </p>
          </div>
        </div>
      </section>

      <CtaBand title="Bank-grade protection, built in" body="Every payout, identity, and record is handled with the care it deserves." secondary={{ label: "Read our Privacy Policy", href: "/privacy" }} />
    </>
  );
}
