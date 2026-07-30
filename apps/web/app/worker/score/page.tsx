"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ScoreBreakdown } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { AppShell, NavItem, icons } from "@/components/shell";
import { Card, ProgressRing, SectionHeader, TierBadge } from "@/components/ui";

const NAV: NavItem[] = [
  { label: "Overview", href: "/worker", icon: icons.overview },
  { label: "Jobs", href: "/worker#jobs", icon: icons.jobs },
  { label: "Earnings", href: "/worker/wallet", icon: icons.earnings },
  { label: "Loans", href: "/worker#loans", icon: icons.loans },
  { label: "My standing", href: "#top", icon: icons.standing },
];

const cap = (s: string) => s[0] + s.slice(1).toLowerCase();

// What a worker can do to move the score (mirrors the engine's weights).
const TIPS = [
  { label: "Complete a shift", delta: "+25", tone: "up" as const },
  { label: "Show up on time", delta: "+10", tone: "up" as const },
  { label: "Repay a loan on time", delta: "+40", tone: "up" as const },
  { label: "A no-show costs", delta: "−40", tone: "down" as const },
];

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return `${Math.floor(d / 604800)}w ago`;
}

function Points({ n }: { n: number }) {
  const up = n >= 0;
  return (
    <span className={`font-semibold ${up ? "text-gold-700" : "text-error"}`}>
      {up ? "+" : "−"}
      {Math.abs(n)}
    </span>
  );
}

export default function ScorePage() {
  const router = useRouter();
  const [data, setData] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      setData(await api.scoreBreakdown(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data)
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-red-600">Couldn&apos;t load your score.</p>
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

  const pctOfMax = (data.score / data.range.max) * 100;
  const withinTier =
    data.progress.ceil > data.progress.floor
      ? ((data.score - data.progress.floor) / (data.progress.ceil - data.progress.floor)) * 100
      : 100;

  return (
    <AppShell role="worker" userName="Standing" nav={NAV} active="My standing" topbarPlaceholder="Search your score history…">
      <div id="top" className="scroll-mt-24">
        <h1 className="font-display text-4xl font-semibold text-ink">Your Tally Score</h1>
        <p className="mt-1 text-ink-soft">
          Exactly what moved your score — the ledger behind the number.
        </p>
      </div>

      {/* Score + progress */}
      <Card className="mt-6 p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
          <ProgressRing pct={pctOfMax} size={148}>
            <span className="font-display text-4xl font-bold text-ink">{data.score}</span>
            <span className="text-xs text-ink-muted">/ {data.range.max}</span>
          </ProgressRing>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <TierBadge tier={data.tier} />
              {data.progress.nextTier && (
                <span className="text-sm text-ink-soft">
                  {data.progress.pointsToNext} pts to {cap(data.progress.nextTier)}
                </span>
              )}
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${withinTier}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label="Shifts done" value={String(data.metrics.jobsCompleted)} />
              <Metric label="On-time" value={`${Math.round(data.metrics.onTimeRate * 100)}%`} />
              <Metric label="Sales" value={String(data.metrics.salesCount)} />
            </div>
          </div>
        </div>
      </Card>

      {/* What's in your score */}
      <section className="mt-10">
        <SectionHeader title="What's in your score" subtitle="Every signal, and the points it added or removed." />
        {data.factors.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">
              No score activity yet. Complete a shift to start building.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {data.factors.map((f) => (
              <div key={f.type} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${f.points >= 0 ? "bg-gold-50 text-gold-700" : "bg-red-50 text-error"}`}>
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
                      {f.points >= 0 ? (
                        <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{f.label}</p>
                    <p className="text-xs text-ink-muted">×{f.count}</p>
                  </div>
                </div>
                <Points n={f.points} />
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Recent activity */}
      <section className="mt-10">
        <SectionHeader title="Recent activity" subtitle="The most recent entries in your score ledger." />
        {data.history.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">Nothing yet.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {data.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{h.label}</p>
                  <p className="text-xs text-ink-muted">{timeAgo(h.at)}</p>
                </div>
                <Points n={h.points} />
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* How to improve */}
      <section className="mt-10">
        <SectionHeader title="How to move it" subtitle="The score is honest — here's what changes it." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map((t) => (
            <Card key={t.label} className="p-5">
              <p className={`font-display text-2xl font-bold ${t.tone === "up" ? "text-gold-700" : "text-error"}`}>
                {t.delta}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{t.label}</p>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Banks and lenders can verify this record — it&apos;s what turns your work into credit.
        </p>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
