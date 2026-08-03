import { Newspaper, Download, Mail, ImageIcon } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/ui";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";
import { PageHero } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Press & Media — Tally",
  description: "Tally's press kit, company facts, and media contact. For the story of economic identity in Nigeria's informal economy.",
};

const FACTS = [
  { k: "What Tally is", v: "An economic-identity platform for Nigeria's informal economy — same-day pay, verified hiring, and a work-based credit score." },
  { k: "Founded", v: "2025 · Lagos, Nigeria" },
  { k: "Who it serves", v: "Informal workers, employers, and market traders across Nigeria." },
  { k: "How it works", v: "Escrow-backed pay released on confirmed attendance, building a verifiable Tally Score that unlocks credit." },
];

const COVERAGE = [
  { title: "Tally launches to bring economic identity to Nigeria's informal workforce", outlet: "Company announcement", date: "2025" },
  { title: "How escrow and a work-based score could reshape informal hiring", outlet: "Feature", date: "2025" },
  { title: "Building fintech for the phone-first majority", outlet: "Interview", date: "2025" },
];

export default function PressPage() {
  return (
    <>
      <PageHero
        eyebrow={<><Newspaper className="h-3.5 w-3.5" /> Press & media</>}
        title="The story of making work count"
        lede="Everything you need to write about Tally — company facts, brand assets, and a direct line to our team."
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="mailto:press@tally.ng" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700">
            <Mail className="h-4 w-4" /> press@tally.ng
          </a>
          <a href="mailto:press@tally.ng?subject=Press%20kit%20request" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand-300">
            <Download className="h-4 w-4" /> Request press kit
          </a>
        </div>
      </PageHero>

      {/* Fast facts */}
      <Section className="py-16 md:py-24">
        <SectionHeading eyebrow="Fast facts" title="Tally at a glance" />
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
          {FACTS.map((f) => (
            <RevealItem key={f.k}>
              <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{f.k}</p>
                <p className="mt-2 text-ink-soft">{f.v}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Brand assets */}
      <section className="border-y border-line bg-canvas/50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="Brand assets" title="Logos & guidelines" subtitle="Please use our name and marks as provided — don't alter, recolour, or stretch them." />
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <ImageIcon className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <p className="mt-4 text-sm text-ink-soft">Logo pack, wordmark, and colour values are available on request.</p>
            <a href="mailto:press@tally.ng?subject=Brand%20assets" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
              <Download className="h-4 w-4" /> Request brand assets
            </a>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <Section className="py-16 md:py-24">
        <SectionHeading eyebrow="In the news" title="Recent coverage & announcements" />
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
          {COVERAGE.map((c) => (
            <div key={c.title} className="flex items-start justify-between gap-4 p-5">
              <p className="text-[15px] font-medium text-ink">{c.title}</p>
              <span className="shrink-0 text-right text-xs text-ink-muted">{c.outlet}<br />{c.date}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
