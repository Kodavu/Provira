import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { Section } from "@/components/marketing/ui";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";
import { PageHero, CtaBand } from "@/components/marketing/page-shell";
import { Newsletter } from "@/components/landing/newsletter";

export const metadata = {
  title: "Blog — Provira",
  description: "Product updates, research, and stories from the frontlines of Nigeria's informal economy.",
};

const POSTS = [
  {
    title: "Why a lifetime of work still can't get a loan — and how we fix it",
    excerpt: "Credit invisibility is the quiet tax on informal work. Here's the case for a verifiable, work-based score.",
    category: "Perspective",
    date: "Coming soon",
    tint: "brand",
  },
  {
    title: "Escrow, explained: how same-day pay actually works on Provira",
    excerpt: "A plain-language walk through funding, confirmation, and release — and why it protects both sides.",
    category: "Product",
    date: "Coming soon",
    tint: "gold",
  },
  {
    title: "Building phone-first: designing for USSD and WhatsApp",
    excerpt: "The majority don't have a data plan to spare. How we make core tasks work on any phone.",
    category: "Engineering",
    date: "Coming soon",
    tint: "brand",
  },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow={<><Newspaper className="h-3.5 w-3.5" /> Blog</>}
        title="Notes on making work count"
        lede="Product updates, research, and stories from the informal economy. We're just getting started — subscribe to be first to read."
      />

      <Section className="py-16 md:py-24">
        <RevealGroup className="grid gap-5 md:grid-cols-3">
          {POSTS.map((p) => (
            <RevealItem key={p.title}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`relative h-36 ${p.tint === "gold" ? "bg-gradient-to-br from-gold-100 to-gold-50" : "bg-gradient-to-br from-brand-100 to-brand-50"}`}>
                  <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:16px_16px]" aria-hidden />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${p.tint === "gold" ? "bg-white/80 text-gold-700" : "bg-white/80 text-brand-700"}`}>
                    {p.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs text-ink-muted">{p.date}</p>
                  <h2 className="mt-2 text-lg font-semibold leading-snug text-ink">{p.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink-soft">{p.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    Read soon <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mx-auto mt-14 max-w-lg rounded-2xl border border-line bg-canvas/60 p-8 text-center">
          <h2 className="text-xl font-bold text-ink">Get new posts in your inbox</h2>
          <p className="mt-2 text-sm text-ink-soft">One email when we publish. No spam, unsubscribe anytime.</p>
          <div className="mx-auto mt-5 max-w-sm">
            <Newsletter />
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
