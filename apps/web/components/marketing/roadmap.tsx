import {
  BrainCircuit,
  Banknote,
  CreditCard,
  FileBarChart,
  Package,
  QrCode,
  Sparkles,
  UserSearch,
  Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "./ui";
import { RevealGroup, RevealItem } from "./motion";

// Structural data (icon + which status each item carries) stays here; the titles,
// bodies and status labels come from the catalog.
const ICONS = [Package, Banknote, UserSearch, Wallet, BrainCircuit, CreditCard, QrCode, FileBarChart, Sparkles];
type StatusKey = "inDev" | "soon" | "planned";
const STATUS_KEYS: StatusKey[] = ["inDev", "planned", "inDev", "soon", "planned", "soon", "planned", "soon", "planned"];
const STATUS_STYLES: Record<StatusKey, string> = {
  inDev: "bg-brand-50 text-brand-700",
  soon: "bg-gold-50 text-gold-700",
  planned: "bg-canvas text-ink-soft",
};

export async function Roadmap() {
  const t = await getTranslations("Home.roadmap");
  const items = t.raw("items") as { title: string; body: string }[];

  return (
    <section id="roadmap" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, idx) => {
            const Icon = ICONS[idx] ?? Package;
            const statusKey = STATUS_KEYS[idx] ?? "planned";
            return (
              <RevealItem key={idx}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-ink-soft">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[statusKey]}`}>
                      {t(`status.${statusKey}`)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{it.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{it.body}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
