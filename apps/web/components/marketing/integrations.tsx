import { Banknote, CalendarClock, Calculator, Mail, MapPin, MessageSquare, Landmark } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "./ui";
import { RevealGroup, RevealItem } from "./motion";

// Compact teaser of the rails Tally plugs into — supported today and planned.
// Icons stay here; labels/notes come from the catalog.
const ICONS = [Banknote, Landmark, MessageSquare, Mail, Calculator, MapPin, CalendarClock];

export async function Integrations() {
  const t = await getTranslations("Home.integrations");
  const items = t.raw("items") as { label: string; note: string }[];

  return (
    <section className="border-t border-line bg-canvas/50 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        <RevealGroup className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it, idx) => {
            const Icon = ICONS[idx] ?? Banknote;
            return (
              <RevealItem key={idx}>
                <div className="flex h-full items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{it.label}</p>
                    <p className="truncate text-xs text-ink-muted">{it.note}</p>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
