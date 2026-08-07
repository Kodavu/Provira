import Link from "next/link";
import { LifeBuoy, Wallet, Briefcase, Store, TrendingUp, ShieldCheck, Smartphone, Search } from "lucide-react";
import { Section } from "@/components/marketing/ui";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Help Center — Truvo",
  description: "Guides and answers for workers, employers, and traders — payments, jobs, the Truvo Score, USSD access, and account security.",
};

const CATEGORIES = [
  { icon: Wallet, title: "Payments & payouts", body: "Escrow, same-day payout, wallets, and withdrawing to your bank.", topics: ["How same-day payout works", "Linking your bank account", "Understanding escrow"] },
  { icon: Briefcase, title: "For employers", body: "Posting jobs, inviting workers, funding escrow, and attendance codes.", topics: ["Post and fund a job", "Invite vs. applicants", "Sharing the attendance code"] },
  { icon: Store, title: "For workers & traders", body: "Finding jobs, applying, logging sales, and getting confirmed.", topics: ["Find jobs near you", "Apply and get accepted", "Log a sale as a trader"] },
  { icon: TrendingUp, title: "The Truvo Score", body: "What builds your score and how it unlocks credit.", topics: ["What affects my score", "Unlocking a stock advance", "Who can see my score"] },
  { icon: Smartphone, title: "USSD & WhatsApp", body: "Using Truvo without a smartphone or with low data.", topics: ["Get started on *347*82#", "Confirm a shift over USSD", "Check your balance"] },
  { icon: ShieldCheck, title: "Account & security", body: "Verification, resetting access, and keeping your account safe.", topics: ["Verify your identity (NIN)", "Reset your PIN", "Report suspicious activity"] },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow={<><LifeBuoy className="h-3.5 w-3.5" /> Help Center</>}
        title="How can we help?"
        lede="Browse guides by topic, or search for exactly what you need. Prefer to talk? A human is always a message away."
      >
        <form action="/help" className="mx-auto flex max-w-md items-center gap-2 rounded-xl border border-line bg-white p-1.5 shadow-card">
          <Search className="ml-2 h-5 w-5 shrink-0 text-ink-muted" />
          <input
            name="q"
            placeholder="Search help articles…"
            aria-label="Search help articles"
            className="w-full bg-transparent px-1 py-2 text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">Search</button>
        </form>
      </PageHero>

      <Section className="py-16 md:py-24">
        <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <RevealItem key={c.title}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <c.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">{c.title}</h2>
                <p className="mt-1.5 text-sm text-ink-soft">{c.body}</p>
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {c.topics.map((t) => (
                    <li key={t}>
                      <Link href="/faq" className="text-sm text-ink-soft transition hover:text-brand-700">{t}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <CtaBand
        title="Still need a hand?"
        body="Our team supports you by email, WhatsApp, and USSD — whichever works for you."
        primary={{ label: "Contact support", href: "/contact" }}
        secondary={{ label: "Read the FAQ", href: "/faq" }}
      />
    </>
  );
}
