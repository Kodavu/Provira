"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { api, type ScoreBreakdown } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Card, SectionHeader, TierBadge } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton, EmptyPanel } from "@/components/page";
import { AnimatedBar, AnimatedRing, CountUp, Stagger, StaggerItem } from "@/components/motion";

const cap = (s: string) => s[0] + s.slice(1).toLowerCase();

const TIPS = [
  { label: "Complete a shift", delta: "+25", up: true },
  { label: "Show up on time", delta: "+10", up: true },
  { label: "Repay a loan on time", delta: "+40", up: true },
  { label: "A no-show costs", delta: "−40", up: false },
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
    <span className={`font-semibold tabular-nums ${up ? "text-gold-700" : "text-error"}`}>
      {up ? "+" : "−"}{Math.abs(n)}
    </span>
  );
}

export default function StandingPage() {
  const { activeRole } = useSession();
  const router = useRouter();
  const { data, error, reload } = usePageData<ScoreBreakdown>((id) => api.scoreBreakdown(id));

  if (activeRole === "EMPLOYER") {
    router.replace("/overview");
    return null;
  }
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const pctOfMax = (data.score / data.range.max) * 100;
  const withinTier =
    data.progress.ceil > data.progress.floor
      ? ((data.score - data.progress.floor) / (data.progress.ceil - data.progress.floor)) * 100
      : 100;

  return (
    <div className="space-y-8">
      <PageHeader title="Your Tally Score" subtitle="Exactly what moved your score — the ledger behind the number." />

      <Card className="p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <AnimatedRing pct={pctOfMax} size={148}>
            <span className="font-display text-4xl font-bold text-ink">
              <CountUp value={data.score} />
            </span>
            <span className="text-xs text-ink-muted">/ {data.range.max}</span>
          </AnimatedRing>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <TierBadge tier={data.tier} />
              {data.progress.nextTier && (
                <span className="text-sm text-ink-soft">
                  {data.progress.pointsToNext} pts to {cap(data.progress.nextTier)}
                </span>
              )}
            </div>
            <div className="mt-4">
              <AnimatedBar pct={withinTier} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label="Shifts done" value={data.metrics.jobsCompleted} />
              <Metric label="On-time" value={Math.round(data.metrics.onTimeRate * 100)} suffix="%" />
              <Metric label="Sales" value={data.metrics.salesCount} />
            </div>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader title="What's in your score" subtitle="Every signal, and the points it added or removed." />
        {data.factors.length === 0 ? (
          <EmptyPanel title="No score activity yet" body="Complete a shift or log a sale to start building." />
        ) : (
          <Card className="divide-y divide-line p-0">
            <Stagger>
              {data.factors.map((f) => (
                <StaggerItem key={f.type}>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-lg ${f.points >= 0 ? "bg-gold-50 text-gold-700" : "bg-red-50 text-error"}`}>
                        {f.points >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{f.label}</p>
                        <p className="text-xs text-ink-muted">×{f.count}</p>
                      </div>
                    </div>
                    <Points n={f.points} />
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Card>
        )}
      </section>

      <section>
        <SectionHeader title="Recent activity" subtitle="The most recent entries in your score ledger." />
        {data.history.length === 0 ? (
          <EmptyPanel title="Nothing yet" />
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

      <section>
        <SectionHeader title="How to move it" subtitle="The score is honest — here's what changes it." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map((t) => (
            <Card key={t.label} className="p-5">
              <p className={`font-display text-2xl font-bold ${t.up ? "text-gold-700" : "text-error"}`}>{t.delta}</p>
              <p className="mt-1 text-sm text-ink-soft">{t.label}</p>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Banks and lenders can verify this record — it&apos;s what turns your work into credit.
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-lg font-semibold text-ink">
        <CountUp value={value} />{suffix}
      </p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
