"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, TraderDashboard } from "@/lib/api";
import {
  Button,
  Card,
  Input,
  Pill,
  TierBadge,
  formatNaira,
} from "@/components/ui";

export function LogSaleCard({
  userId,
  onLogged,
}: {
  userId: string;
  onLogged: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "cash" | "transfer">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const naira = Number(amount);
    if (!naira || naira <= 0) {
      setError("Enter an amount");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.logSale(userId, String(Math.round(naira * 100)), method);
      toast.success("Sale logged", { description: `${formatNaira(String(Math.round(naira * 100)))} · ${method}` });
      setAmount("");
      onLogged();
    } catch (e) {
      setError((e as Error).message);
      toast.error("Couldn't log sale", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <p className="eyebrow">Log a sale</p>
      <h2 className="mb-4 mt-1 font-display text-xl font-semibold text-ink">
        Record what you sold
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center rounded-xl border border-line bg-surface px-3.5">
          <span className="font-display text-ink-muted">₦</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0"
            inputMode="numeric"
            className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
          {(["card", "cash", "transfer"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                method === m ? "bg-brand-700 text-white" : "text-ink-soft hover:bg-canvas"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <Button onClick={submit} disabled={loading}>
          {loading ? "Logging…" : "Log sale"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-sm text-ink-muted">
        Every logged sale builds your reliability record — and unlocks stock loans.
      </p>
    </Card>
  );
}

export function TraderStanding({ score }: { score: TraderDashboard["score"] }) {
  return (
    <Card className="flex h-full flex-col items-center justify-center p-6 text-center">
      <p className="font-display text-6xl font-bold tracking-tight text-ink">{score.value}</p>
      <div className="mt-3">
        <TierBadge tier={score.tier} />
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {score.salesCount} sales logged. Keep logging to climb.
      </p>
    </Card>
  );
}

const METHOD_TONE: Record<string, "green" | "amber" | "neutral"> = {
  card: "green",
  transfer: "amber",
  cash: "neutral",
};

export function SalesList({ sales }: { sales: TraderDashboard["sales"] }) {
  if (sales.length === 0)
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">No sales logged yet.</p>
      </Card>
    );
  return (
    <Card className="divide-y divide-line p-0">
      {sales.map((s) => (
        <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-50 text-gold-700">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.7}>
                <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Sale</p>
              <p className="text-xs text-ink-muted">
                {new Date(s.occurredAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone={METHOD_TONE[s.method] ?? "neutral"}>{s.method}</Pill>
            <span className="font-display font-semibold text-gold-700">
              +{formatNaira(s.amount)}
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}
