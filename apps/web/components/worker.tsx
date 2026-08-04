"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { api, WorkerDashboard } from "@/lib/api";
import { Clock, TrendingUp, Wallet } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Kpi,
  Pill,
  ProgressBar,
  TierBadge,
  formatNaira,
} from "@/components/ui";
import { CountUp, CountUpNaira } from "@/components/motion";

const TIER_ORDER = ["BUILDING", "EMERGING", "TRUSTED", "ESTABLISHED"];
const TIER_MIN: Record<string, number> = {
  BUILDING: 0,
  EMERGING: 250,
  TRUSTED: 500,
  ESTABLISHED: 750,
};
const cap = (s: string) => s[0] + s.slice(1).toLowerCase();

export function StandingCard({ score }: { score: WorkerDashboard["score"] }) {
  const idx = TIER_ORDER.indexOf(score.tier);
  const nextTier = TIER_ORDER[idx + 1];
  const pts = nextTier ? Math.max(0, TIER_MIN[nextTier] - score.value) : 0;
  const base = TIER_MIN[score.tier];
  const span = nextTier ? TIER_MIN[nextTier] - base : 1;
  const pct = nextTier ? ((score.value - base) / span) * 100 : 100;

  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
        <p className="font-display text-6xl font-bold tracking-tight text-ink">{score.value}</p>
        <div className="mt-3">
          <TierBadge tier={score.tier} />
        </div>
      </div>

      <div className="rounded-xl bg-canvas p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink">
            {nextTier ? `Next: ${cap(nextTier)}` : "Top tier reached"}
          </span>
          {nextTier && <span className="text-ink-muted">{pts} pts to go</span>}
        </div>
        <div className="mt-2">
          <ProgressBar pct={pct} />
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          {nextTier
            ? `${score.jobsCompleted} shifts done · ${Math.round(
                score.onTimeRate * 100,
              )}% on time. Keep showing up to reach ${cap(nextTier)}.`
            : "You're at the highest reliability tier. Keep it up."}
        </p>
      </div>
    </Card>
  );
}

export function HustleStats({
  score,
  assignments,
  wallet,
}: {
  score: WorkerDashboard["score"];
  assignments: WorkerDashboard["assignments"];
  wallet: WorkerDashboard["wallet"];
}) {
  const confirmed = assignments.filter(
    (a) => a.attendance?.status === "CONFIRMED",
  );
  const earned = confirmed.reduce((s, a) => s + Number(a.job.payAmount), 0);

  return (
    <Card className="p-6">
      <p className="eyebrow">This week</p>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Your hustle, counted
        </h2>
        <Pill>Mon — Sun</Pill>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Earnings"
          value={<CountUpNaira amount={earned} />}
          caption={earned ? `From ${confirmed.length} confirmed shift(s).` : "No earnings yet this week."}
        />
        <Kpi
          icon={<Clock className="h-4 w-4" />}
          label="Shifts"
          value={<CountUp value={confirmed.length} />}
          caption={confirmed.length ? "Confirmed & paid." : "No shifts completed yet."}
          accent="neutral"
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="On-time rate"
          value={<><CountUp value={Math.round(score.onTimeRate * 100)} />%</>}
          caption={`Across ${score.jobsCompleted} completed shift(s).`}
        />
        <Kpi
          icon={<Wallet className="h-4 w-4" />}
          label="Wallet"
          value={<CountUpNaira amount={wallet.balance} />}
          caption="Available to withdraw."
          accent="amber"
        />
      </div>
    </Card>
  );
}

export function NextGoal({ done, target }: { done: number; target: number }) {
  return (
    <Card className="bg-brand-50/60 p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-700 text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm5 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="eyebrow text-brand-700">Your next goal</p>
            <p className="mt-1 max-w-md font-medium text-ink">
              Finish {target} paid shifts this month to unlock the streak badge.
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">Streak badge plus bonus payout.</p>
          </div>
        </div>
        <div className="md:text-right">
          <div className="flex gap-1.5 md:justify-end">
            {Array.from({ length: target }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${i < done ? "bg-brand-600" : "bg-brand-100"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            {done} of {target} jobs
          </p>
        </div>
      </div>
    </Card>
  );
}

export function ApplyCodeBanner({
  jobTitle,
  code,
  onDismiss,
}: {
  jobTitle: string;
  code: string | null;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-brand-200 bg-brand-50/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-brand-700">You applied — {jobTitle}</p>
          {code ? (
            <>
              <p className="mt-1 text-ink">
                Your confirmation code is{" "}
                <span className="font-display text-2xl font-semibold tracking-[0.3em] text-brand-800">
                  {code}
                </span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                The employer confirms this on site. Enter it under{" "}
                <strong>Your jobs</strong> to confirm attendance and get paid.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">
              You&apos;ve already applied — find this shift under{" "}
              <strong>Your jobs</strong>.
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-ink-muted hover:bg-brand-100"
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </Card>
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
      <Card className="p-6">
        <p className="text-sm text-ink-muted">
          No active jobs yet. Apply to a job nearby to get started.
        </p>
      </Card>
    );

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-canvas text-ink-muted">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
                <path d="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm5 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-ink">{a.job.title}</p>
              <p className="text-sm text-ink-muted">
                {formatNaira(a.job.payAmount)} · {a.status.toLowerCase()}
              </p>
            </div>
          </div>
          {a.attendance?.status === "CONFIRMED" ? (
            <Pill tone="green">Confirmed · paid</Pill>
          ) : (
            <ConfirmForm assignmentId={a.id} onConfirmed={onConfirmed} />
          )}
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
      toast.success("Attendance confirmed", { description: "Your payout is on the way." });
      onConfirmed();
    } catch (e) {
      const wrong = (e as Error).message.includes("Invalid");
      setError(wrong ? "Wrong code" : "Failed");
      toast.error(wrong ? "That code isn't right" : "Couldn't confirm", {
        description: wrong ? "Check the 4-digit code with the employer." : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <div className="flex items-center gap-2">
        <div className="w-28">
          <Input
            value={code}
            onChange={setCode}
            placeholder="4-digit code"
            inputMode="numeric"
            maxLength={4}
          />
        </div>
        <Button onClick={submit} disabled={loading || code.length !== 4}>
          {loading ? "…" : "Confirm"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function JobsNearby({
  jobs,
  onApply,
  applyingId,
}: {
  jobs: WorkerDashboard["openJobs"];
  onApply: (jobId: string) => void;
  applyingId: string | null;
}) {
  if (jobs.length === 0)
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">
          No new jobs nearby right now — you&apos;ve applied to what&apos;s open.
        </p>
      </Card>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {jobs.map((j) => (
        <Card key={j.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{j.title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {j.location?.label ?? "Nearby"}
                {j.skills.length > 0 && ` · ${j.skills.map((s) => s.skill.name).join(", ")}`}
              </p>
            </div>
            <p className="whitespace-nowrap font-display text-lg font-semibold text-ink">
              {formatNaira(j.payAmount)}
            </p>
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApply(j.id)}
              disabled={applyingId === j.id}
            >
              {applyingId === j.id ? "Applying…" : "Apply"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function LoanOffers({
  offers,
  userId,
}: {
  offers: WorkerDashboard["loanOffers"];
  userId: string;
}) {
  const t = useTranslations("LoanOffers");
  if (offers.length === 0)
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">
          {t("empty")}
        </p>
      </Card>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {offers.map((o) => (
        <LoanOfferCard key={o.productId} offer={o} userId={userId} />
      ))}
    </div>
  );
}

function LoanOfferCard({
  offer: o,
  userId,
}: {
  offer: WorkerDashboard["loanOffers"][number];
  userId: string;
}) {
  const t = useTranslations("LoanOffers");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState<null | "APPROVED" | "REJECTED" | "PENDING">(null);

  async function request() {
    setBusy(true);
    try {
      const res = await api.applyForLoan(userId, o.productId, o.maxAmount);
      setApplied(res.status);
      if (res.status === "APPROVED") {
        toast.success(t("loanApproved"), {
          description: t("loanApprovedDesc", { amount: formatNaira(o.maxAmount), name: o.name }),
        });
      } else {
        toast.error(t("notApproved"), {
          description: res.decisionReason ?? t("notApprovedFallback"),
        });
      }
    } catch (e) {
      toast.error(t("submitFailed"), { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <path d="M3 10 12 4l9 6M5 10v9h14v-9M9 19v-5h6v5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {applied === "APPROVED" ? (
          <Pill tone="green">{t("approved")}</Pill>
        ) : o.eligible ? (
          <Pill tone="green">{t("eligible")}</Pill>
        ) : (
          <Pill>{t("locked")}</Pill>
        )}
      </div>
      <p className="mt-3 font-semibold text-ink">{o.name}</p>
      <p className="text-sm text-ink-muted">
        {t("upToNeeds", { amount: formatNaira(o.maxAmount), minScore: o.minScore })}
      </p>
      <div className="mt-4">
        <Button disabled={!o.eligible || busy || applied === "APPROVED"} size="sm" onClick={request}>
          {applied === "APPROVED"
            ? t("approvedCheck")
            : busy
              ? t("submitting")
              : o.eligible
                ? t("requestLoan")
                : t("keepBuilding")}
        </Button>
      </div>
    </Card>
  );
}
