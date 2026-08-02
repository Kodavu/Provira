"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Landmark, ShieldCheck } from "lucide-react";
import { api, type WalletData } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Button, Card, SectionHeader, formatNaira } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton, EmptyPanel } from "@/components/page";
import { CountUpNaira, FadeIn, Stagger, StaggerItem } from "@/components/motion";

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return `${Math.floor(d / 604800)}w ago`;
}

export default function EarningsPage() {
  const { userId, activeRole } = useSession();
  const router = useRouter();
  const { data, error, reload } = usePageData<WalletData>((id) => api.wallet(id));
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (activeRole === "EMPLOYER") {
    router.replace("/overview");
    return null;
  }

  const hasPayout = !!data?.payoutDestination?.accountNumber && data.payoutDestination.accountNumber !== "—";

  async function withdraw() {
    const naira = Number(amount);
    if (!naira || naira <= 0) return;
    if (!hasPayout) {
      toast.error("Add a payout account first", { description: "Verify your account to receive withdrawals." });
      return;
    }
    setBusy(true);
    try {
      const res = await api.withdraw(userId, String(Math.round(naira * 100)));
      toast.success("Withdrawal sent", { description: `${formatNaira(String(Math.round(naira * 100)))} to ${data?.payoutDestination.bank}.` });
      setAmount("");
      setShowForm(false);
      reload();
      void res;
    } catch (e) {
      const insufficient = (e as Error).message.includes("Insufficient");
      toast.error(insufficient ? "Insufficient balance" : "Withdrawal failed", {
        description: insufficient ? "You can't withdraw more than your available balance." : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Earnings" subtitle="What landed in your wallet, and where it goes when you withdraw." />

      <FadeIn delay={0.05}>
        <Card className="overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-gold-700">Available now</p>
              <p className="mt-1 font-display text-5xl font-semibold tracking-tight text-ink">
                <CountUpNaira amount={data.available} />
              </p>
              <p className="mt-1 text-sm text-ink-muted">in your Tally wallet</p>
            </div>
            <Button onClick={() => setShowForm((v) => !v)}>
              Withdraw <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          {showForm && (
            <div className="mt-5 border-t border-line pt-5">
              {!hasPayout ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-700 ring-1 ring-gold-200">
                  <span>Add a payout account to receive withdrawals.</span>
                  <Link href="/verify"><Button size="sm" variant="outline">Add account</Button></Link>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-1 items-center rounded-xl border border-line bg-surface px-3.5">
                    <span className="font-display text-ink-muted">₦</span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="Amount to withdraw"
                      inputMode="numeric"
                      className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <Button onClick={withdraw} disabled={busy}>{busy ? "Sending…" : "Confirm withdrawal"}</Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </FadeIn>

      {/* Where withdrawals land */}
      {hasPayout ? (
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Landmark className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-brand-700">Where withdrawals land</p>
            <p className="mt-0.5 font-semibold text-ink">{data.payoutDestination.bank}</p>
            <p className="text-sm text-ink-muted">
              {data.payoutDestination.accountName} · ••••{data.payoutDestination.accountNumber.slice(-4)}
            </p>
          </div>
          <Link href="/verify"><Button size="sm" variant="outline">Change</Button></Link>
        </Card>
      ) : (
        <EmptyPanel
          icon={ShieldCheck}
          title="No payout account yet"
          body="Add a verified bank account so your earnings can reach you."
          action={<Link href="/verify"><Button size="sm">Add payout account</Button></Link>}
        />
      )}

      <section>
        <SectionHeader title="Recent activity" subtitle="Money in, money out — everything that touched your wallet." />
        {data.activity.length === 0 ? (
          <EmptyPanel title="No activity yet" body="Confirm a shift to see your first payout here." />
        ) : (
          <Card className="divide-y divide-line p-0">
            <Stagger>
              {data.activity.map((a) => {
                const isIn = a.direction === "in";
                return (
                  <StaggerItem key={a.id}>
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 place-items-center rounded-lg ${isIn ? "bg-gold-50 text-gold-700" : "bg-canvas text-ink-soft"}`}>
                          {isIn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{a.label}</p>
                          <p className="text-xs text-ink-muted">{timeAgo(a.at)}</p>
                        </div>
                      </div>
                      <span className={`font-display font-semibold tabular-nums ${isIn ? "text-gold-700" : "text-ink"}`}>
                        {isIn ? "+" : "−"}{formatNaira(a.amount)}
                      </span>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </Card>
        )}
      </section>
    </div>
  );
}
