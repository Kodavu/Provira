import { Banknote, CalendarClock, Calculator, Mail, MapPin, MessageSquare, Landmark } from "lucide-react";
import { SectionHeading } from "./ui";
import { RevealGroup, RevealItem } from "./motion";

// Compact teaser of the rails Tally plugs into — supported today and planned.
const INTEGRATIONS = [
  { icon: Banknote, label: "Payment providers", note: "Squad & more" },
  { icon: Landmark, label: "Bank transfers", note: "NIBSS rails" },
  { icon: MessageSquare, label: "SMS & WhatsApp", note: "Reach any phone" },
  { icon: Mail, label: "Email services", note: "Notifications" },
  { icon: Calculator, label: "Accounting", note: "Planned" },
  { icon: MapPin, label: "Maps & location", note: "Ward-level" },
  { icon: CalendarClock, label: "Calendar & payroll", note: "Planned" },
];

export function Integrations() {
  return (
    <section className="border-t border-line bg-canvas/50 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Integrations"
          title="Works with the tools you already use"
          subtitle="Tally connects to the payment, messaging, and business rails that keep Nigeria moving — with more on the way."
        />
        <RevealGroup className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {INTEGRATIONS.map((it) => (
            <RevealItem key={it.label}>
              <div className="flex h-full items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <it.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{it.label}</p>
                  <p className="truncate text-xs text-ink-muted">{it.note}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
