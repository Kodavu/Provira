"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, WalletData } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { AppShell, NavItem, icons } from "@/components/shell";
import { Button, Card, Input, SectionHeader, formatNaira } from "@/components/ui";

const NAV: NavItem[] = [
  { label: "Overview", href: "/worker", icon: icons.overview },
  { label: "Jobs", href: "/worker#jobs", icon: icons.jobs },
  { label: "Earnings", href: "#top", icon: icons.earnings },
  { label: "Activity", href: "#activity", icon: icons.wallet },
  { label: "Loans", href: "/worker#loans", icon: icons.loans },
];

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return `${Math.floor(d / 604800)}w ago`;
}

export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      setData(await api.wallet(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function withdraw() {
    const userId = getUserId();
    const naira = Number(amount);
    if (!userId || !naira || naira <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.withdraw(userId, String(Math.round(naira * 100)));
      setData(res);
      setAmount("");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message.includes("Insufficient") ? "Insufficient balance" : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data)
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-red-600">Couldn&apos;t load your wallet.</p>
        <p className="mt-2 text-sm text-ink-muted">{error}</p>
        <Link href="/login" className="mt-4 inline-block text-brand-700 underline">
          Sign in again
        </Link>
      </main>
    );

  if (!data)
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="h-8 w-40 animate-pulse rounded bg-line" />
        <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-line" />
      </div>
    );

  return (
    <AppShell role="worker" userName="Wallet" nav={NAV} active="Earnings" topbarPlaceholder="Search transactions…">
      <div id="top" className="scroll-mt-24">
        <h1 className="font-display text-4xl font-semibold text-ink">Earnings</h1>
        <p className="mt-1 text-ink-soft">What landed in your wallet, what&apos;s still pending.</p>
      </div>

      {/* Available balance */}
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-brand-700">Available now</p>
            <p className="mt-1 font-display text-5xl font-semibold text-ink">
              {formatNaira(data.available)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">in your Tally wallet</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            Withdraw
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>

        {showForm && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
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
            <Button onClick={withdraw} disabled={busy}>
              {busy ? "Sending…" : "Confirm withdrawal"}
            </Button>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
          </div>
        )}
      </Card>

      {/* Where withdrawals land */}
      <Card className="mt-4 flex items-center gap-4 p-5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <path d="M4 10h16M4 10 12 4l8 6M6 10v8M18 10v8M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="eyebrow text-brand-700">Where withdrawals land</p>
          <p className="mt-0.5 font-semibold text-ink">{data.payoutDestination.bank}</p>
          <p className="text-sm text-ink-muted">
            {data.payoutDestination.accountName} · {data.payoutDestination.accountNumber}
          </p>
        </div>
      </Card>

      {/* Recent activity */}
      <section id="activity" className="mt-10 scroll-mt-24">
        <SectionHeader
          title="Recent activity"
          subtitle="Money in, money out — everything that touched your wallet."
        />
        {data.activity.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">
              No activity yet. Confirm a shift to see your first payout here.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {data.activity.map((a) => {
              const isIn = a.direction === "in";
              return (
                <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-lg ${
                        isIn ? "bg-brand-50 text-brand-700" : "bg-canvas text-ink-soft"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                        {isIn ? (
                          <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                          <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{a.label}</p>
                      <p className="text-xs text-ink-muted">{timeAgo(a.at)}</p>
                    </div>
                  </div>
                  <span className={`font-display font-semibold ${isIn ? "text-brand-700" : "text-ink"}`}>
                    {isIn ? "+" : "−"}
                    {formatNaira(a.amount)}
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </AppShell>
  );
}
