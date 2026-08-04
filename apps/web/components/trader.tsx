"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Sales");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "cash" | "transfer">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const naira = Number(amount);
    if (!naira || naira <= 0) {
      setError(t("enterAmount"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.logSale(userId, String(Math.round(naira * 100)), method);
      toast.success(t("saleLogged"), { description: t("saleLoggedDesc", { amount: formatNaira(String(Math.round(naira * 100))), method: t(`methods.${method}`) }) });
      setAmount("");
      onLogged();
    } catch (e) {
      setError((e as Error).message);
      toast.error(t("logFailed"), { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <p className="eyebrow">{t("logSaleEyebrow")}</p>
      <h2 className="mb-4 mt-1 font-display text-xl font-semibold text-ink">
        {t("recordWhat")}
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
              {t(`methods.${m}`)}
            </button>
          ))}
        </div>
        <Button onClick={submit} disabled={loading}>
          {loading ? t("logging") : t("logSale")}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-sm text-ink-muted">
        {t("logNote")}
      </p>
    </Card>
  );
}

export function TraderStanding({ score }: { score: TraderDashboard["score"] }) {
  const t = useTranslations("Sales");
  return (
    <Card className="flex h-full flex-col items-center justify-center p-6 text-center">
      <p className="font-display text-6xl font-bold tracking-tight text-ink">{score.value}</p>
      <div className="mt-3">
        <TierBadge tier={score.tier} />
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {t("salesLogged", { count: score.salesCount })}
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
  const t = useTranslations("Sales");
  if (sales.length === 0)
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">{t("noSales")}</p>
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
              <p className="text-sm font-medium text-ink">{t("sale")}</p>
              <p className="text-xs text-ink-muted">
                {new Date(s.occurredAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone={METHOD_TONE[s.method] ?? "neutral"}>{["card", "cash", "transfer"].includes(s.method) ? t(`methods.${s.method}`) : s.method}</Pill>
            <span className="font-display font-semibold text-gold-700">
              +{formatNaira(s.amount)}
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}
