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
import { SectionHeading } from "./ui";
import { RevealGroup, RevealItem } from "./motion";

type Status = "In development" | "Coming soon" | "On our roadmap";

const STATUS_STYLES: Record<Status, string> = {
  "In development": "bg-brand-50 text-brand-700",
  "Coming soon": "bg-gold-50 text-gold-700",
  "On our roadmap": "bg-canvas text-ink-soft",
};

const ITEMS: { icon: typeof Wallet; title: string; body: string; status: Status }[] = [
  { icon: Package, title: "POS System", body: "Sales, inventory, receipts and multi-store — a full till for traders.", status: "In development" },
  { icon: Banknote, title: "Payroll Automation", body: "Run recurring pay for your crew, straight from confirmed shifts.", status: "On our roadmap" },
  { icon: UserSearch, title: "AI Job Matching", body: "Smarter matches between workers and employers, down to the ward.", status: "In development" },
  { icon: Wallet, title: "Digital Wallet", body: "Hold, send and receive business payments inside Tally.", status: "Coming soon" },
  { icon: BrainCircuit, title: "Inventory Intelligence", body: "Predict restocks and flag slow movers from your sales.", status: "On our roadmap" },
  { icon: CreditCard, title: "Business Loans", body: "Working capital sized to your verifiable Tally record.", status: "Coming soon" },
  { icon: QrCode, title: "QR Payments", body: "Take instant payments at the counter with a scan.", status: "On our roadmap" },
  { icon: FileBarChart, title: "Financial Reports", body: "Profit, cash flow and daily summaries, generated for you.", status: "Coming soon" },
  { icon: Sparkles, title: "AI Hiring Assistant", body: "Draft job posts and shortlist applicants in seconds.", status: "On our roadmap" },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Product vision"
          title="Where Tally is headed next"
          subtitle="We're building toward one platform that runs work and business end to end. Here's what's coming — labelled honestly so you always know what's live today."
        />
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <RevealItem key={it.title}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-ink-soft">
                    <it.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[it.status]}`}>
                    {it.status}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{it.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{it.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
