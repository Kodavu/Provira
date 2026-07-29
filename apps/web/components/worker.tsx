"use client";

import { useState } from "react";
import { api, formatNaira, WorkerDashboard } from "@/lib/api";
import { Button, Card, TierBadge } from "@/components/ui";

const TIER_ORDER = ["BUILDING", "EMERGING", "TRUSTED", "ESTABLISHED"];
// Lower bound of each tier on the 0–1000 score scale (mirrors core config).
const TIER_MIN: Record<string, number> = {
  BUILDING: 0,
  EMERGING: 250,
  TRUSTED: 500,
  ESTABLISHED: 750,
};

export function ScoreCard({ score }: { score: WorkerDashboard["score"] }) {
  const idx = TIER_ORDER.indexOf(score.tier);
  const nextTier = TIER_ORDER[idx + 1];
  const nextAt = nextTier ? TIER_MIN[nextTier] : null;
  const pct = Math.min(100, (score.value / 1000) * 100);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Reliability score</p>
          <p className="mt-1 text-4xl font-extrabold text-neutral-900">
            {score.value}
            <span className="text-lg font-medium text-neutral-400"> / 1000</span>
          </p>
        </div>
        <TierBadge tier={score.tier} />
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {nextAt !== null && (
        <p className="mt-2 text-sm text-neutral-500">
          {nextAt - score.value > 0
            ? `${nextAt - score.value} points to ${nextTier[0] + nextTier.slice(1).toLowerCase()}`
            : `You've reached ${score.tier[0] + score.tier.slice(1).toLowerCase()}`}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="font-semibold text-neutral-900">{score.jobsCompleted}</div>
          <div className="text-neutral-500">Jobs completed</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="font-semibold text-neutral-900">
            {Math.round(score.onTimeRate * 100)}%
          </div>
          <div className="text-neutral-500">On-time rate</div>
        </div>
      </div>
    </Card>
  );
}

export function WalletCard({ wallet }: { wallet: WorkerDashboard["wallet"] }) {
  // Own container (not <Card>) so the brand background isn't overridden by
  // Card's bg-white in Tailwind's source order.
  return (
    <div className="rounded-2xl bg-brand-700 p-5 text-white shadow-sm">
      <p className="text-sm font-medium text-brand-100">Wallet balance</p>
      <p className="mt-1 text-4xl font-extrabold text-white">
        {formatNaira(wallet.balance)}
      </p>
      <p className="mt-2 text-sm text-brand-100">
        Paid out same-day when a job is confirmed.
      </p>
    </div>
  );
}

export function AssignmentsList({
  assignments,
  onConfirmed,
}: {
  assignments: WorkerDashboard["assignments"];
  onConfirmed: () => void;
}) {
  if (assignments.length === 0)
    return (
      <Card>
        <p className="text-sm text-neutral-500">
          No active jobs yet. Accept a job below to get started.
        </p>
      </Card>
    );

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <Card key={a.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900">{a.job.title}</p>
              <p className="text-sm text-neutral-500">
                {formatNaira(a.job.payAmount)} · {a.status}
              </p>
            </div>
            {a.attendance?.status === "CONFIRMED" ? (
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                Confirmed · paid
              </span>
            ) : (
              <ConfirmForm assignmentId={a.id} onConfirmed={onConfirmed} />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ConfirmForm({
  assignmentId,
  onConfirmed,
}: {
  assignmentId: string;
  onConfirmed: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await api.confirmAttendance(assignmentId, code);
      onConfirmed();
    } catch (e) {
      setError((e as Error).message.includes("Invalid") ? "Wrong code" : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="4-digit code"
          inputMode="numeric"
          maxLength={4}
          className="w-28 rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <Button onClick={submit} disabled={loading || code.length !== 4}>
          {loading ? "…" : "Confirm"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function JobsNearby({ jobs }: { jobs: WorkerDashboard["openJobs"] }) {
  if (jobs.length === 0)
    return (
      <Card>
        <p className="text-sm text-neutral-500">No open jobs nearby right now.</p>
      </Card>
    );
  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <Card key={j.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900">{j.title}</p>
              <p className="text-sm text-neutral-500">
                {j.location?.label ?? "Nearby"}
                {j.skills.length > 0 &&
                  ` · ${j.skills.map((s) => s.skill.name).join(", ")}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-700">{formatNaira(j.payAmount)}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function LoanOffers({ offers }: { offers: WorkerDashboard["loanOffers"] }) {
  return (
    <div className="space-y-3">
      {offers.map((o) => (
        <Card key={o.productId}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900">{o.name}</p>
              <p className="text-sm text-neutral-500">
                Up to {formatNaira(o.maxAmount)} · needs score {o.minScore}+
              </p>
            </div>
            {o.eligible ? (
              <Button>Apply</Button>
            ) : (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
                Keep building
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
