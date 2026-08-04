"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "./motion";

// Accent per card (by index); the quotes/names/roles come from the catalog.
const TINTS = ["brand", "gold", "brand", "gold"] as const;

interface Item {
  quote: string;
  name: string;
  role: string;
}

export function Testimonials() {
  const t = useTranslations("Home.testimonials");
  const items = t.raw("items") as Item[];

  return (
    <div>
      <Reveal className="mb-10 flex items-center justify-center gap-1.5 text-gold-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-current" />
        ))}
        <span className="ml-2 text-sm font-medium text-ink-soft">{t("lovedBy")}</span>
      </Reveal>

      <RevealGroup className="grid gap-4 sm:grid-cols-2">
        {items.map((item, idx) => {
          const tint = TINTS[idx % TINTS.length];
          return (
            <RevealItem key={idx}>
              <figure className="group relative h-full overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 ${tint === "gold" ? "bg-gold-500" : "bg-brand-500"}`}
                />
                <blockquote className="text-pretty text-[15px] leading-relaxed text-ink-soft">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${
                      tint === "gold" ? "bg-gold-50 text-gold-700" : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{item.name}</span>
                    <span className="block text-xs text-ink-muted">{item.role}</span>
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </div>
  );
}
