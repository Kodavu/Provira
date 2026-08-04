import {
  BarChart3,
  Boxes,
  CloudUpload,
  CreditCard,
  Package,
  Receipt,
  ScanLine,
  Store,
  Users,
  WalletMinimal,
} from "lucide-react";
import { Glow, GridPattern } from "./ui";
import { Reveal, RevealGroup, RevealItem } from "./motion";

// Trader spotlight: the platform is evolving into an all-in-one business OS.
// POS + tools are clearly labelled Coming Soon so we never mislead.
const POS_FEATURES = [
  { icon: Receipt, label: "Sales & receipts" },
  { icon: Boxes, label: "Inventory & catalog" },
  { icon: ScanLine, label: "Barcode scanning" },
  { icon: Users, label: "Customers & suppliers" },
  { icon: Package, label: "Stock alerts" },
  { icon: BarChart3, label: "Daily reports & profit" },
  { icon: WalletMinimal, label: "Expense tracking" },
  { icon: Store, label: "Multi-store support" },
  { icon: CloudUpload, label: "Offline + cloud sync" },
];

export function PosSpotlight() {
  return (
    <section id="pos" className="relative scroll-mt-24 overflow-hidden border-y border-line bg-gradient-to-br from-gold-50/70 via-white to-white py-20 md:py-28">
      <GridPattern className="text-gold-200/50" />
      <Glow className="-right-32 -top-24 h-[28rem] w-[28rem] opacity-40" from="#fbdd8f" to="#f5b301" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-700">
            <Package className="h-3.5 w-3.5" /> For traders · Coming soon
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            An all-in-one{" "}
            <span className="bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">business operating system</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Start building your sales record today. Soon, Tally becomes the till, the stockroom, and the
            accountant too — a complete POS and business toolkit built for Nigerian traders, online and offline.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="/signup?type=trader" className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gold-500/25 transition hover:bg-gold-600">
              Start selling on Tally
            </a>
            <a href="/#roadmap" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold-200">
              View the roadmap
            </a>
          </div>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {POS_FEATURES.map((f) => (
            <RevealItem key={f.label}>
              <div className="group flex h-full flex-col gap-2 rounded-2xl border border-gold-100 bg-white/80 p-4 shadow-card backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-50 text-gold-700">
                  <f.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="text-sm font-semibold leading-tight text-ink">{f.label}</span>
              </div>
            </RevealItem>
          ))}
          <RevealItem>
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gold-200 bg-gold-50/50 p-4 text-center text-sm font-semibold text-gold-700">
              <CreditCard className="mr-1.5 h-4 w-4" /> …and more
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}
