"use client";

import { Star } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "./motion";

const TESTIMONIALS = [
  {
    quote:
      "I used to wait days to get paid after a shift. With Tally the money hits my account the same evening — and my score got me my first stock loan.",
    name: "Amaka O.",
    role: "Warehouse worker · Lagos",
    tint: "brand",
  },
  {
    quote:
      "Before, I hired people I didn't know and hoped they'd show up. Now I see verified workers with real track records and only pay when the job is confirmed.",
    name: "Bola A.",
    role: "Logistics employer · Ikeja",
    tint: "gold",
  },
  {
    quote:
      "Every sale I log builds my record. When I needed capital to restock, the bank could actually see my history. That never happened before.",
    name: "Musa I.",
    role: "Market trader · Kano",
    tint: "brand",
  },
  {
    quote:
      "No smartphone, no problem — I confirm shifts over USSD. Tally treats people like me as customers, not an afterthought.",
    name: "Grace E.",
    role: "Cleaner · Abuja",
    tint: "gold",
  },
];

export function Testimonials() {
  return (
    <div>
      <Reveal className="mb-10 flex items-center justify-center gap-1.5 text-gold-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-current" />
        ))}
        <span className="ml-2 text-sm font-medium text-ink-soft">Loved by workers, employers &amp; traders</span>
      </Reveal>

      <RevealGroup className="grid gap-4 sm:grid-cols-2">
        {TESTIMONIALS.map((t) => (
          <RevealItem key={t.name}>
            <figure className="group relative h-full overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-1 ${t.tint === "gold" ? "bg-gold-500" : "bg-brand-500"}`}
              />
              <blockquote className="text-pretty text-[15px] leading-relaxed text-ink-soft">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${
                    t.tint === "gold" ? "bg-gold-50 text-gold-700" : "bg-brand-50 text-brand-700"
                  }`}
                >
                  {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{t.name}</span>
                  <span className="block text-xs text-ink-muted">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
