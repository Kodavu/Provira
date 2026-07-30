// The reliability score engine: a PURE function of the append-only event log.
// Given a user's ScoreEvents, it produces a deterministic score, tier, and the
// derived metrics we surface (jobs completed, on-time rate, sales count).
//
// Purity matters: the same events always yield the same score, so we can replay
// history, unit-test cutoffs, and explain a number to a worker or auditor.

import { DEFAULT_SCORE_CONFIG, ScoreConfig, ScoreTier } from "./config.js";

export type ScoreEventType =
  | "JOB_COMPLETED"
  | "JOB_ON_TIME"
  | "JOB_NO_SHOW"
  | "SALE_LOGGED"
  | "LOAN_REPAID_ON_TIME"
  | "LOAN_DEFAULT"
  | "DISPUTE_RAISED"
  | "MANUAL_ADJUSTMENT";

export interface ScoreEventInput {
  type: ScoreEventType;
  /** Only used for MANUAL_ADJUSTMENT (raw point delta before multiplier). */
  weight?: number;
  createdAt?: Date;
}

export interface ScoreResult {
  score: number;
  tier: ScoreTier;
  jobsCompleted: number;
  onTimeRate: number; // 0..1
  salesCount: number;
  /** Per-type point contribution, for explainability. */
  breakdown: Record<string, number>;
}

/** A ScoreResult plus the per-event point deltas — the ledger behind the number. */
export interface ScoreExplanation extends ScoreResult {
  counts: Record<string, number>;
  events: Array<{ type: ScoreEventType; points: number; createdAt?: Date }>;
}

function tierFor(score: number, config: ScoreConfig): ScoreTier {
  const t = config.tierThresholds;
  if (score >= t.ESTABLISHED) return "ESTABLISHED";
  if (score >= t.TRUSTED) return "TRUSTED";
  if (score >= t.EMERGING) return "EMERGING";
  return "BUILDING";
}

/**
 * Full explanation of a score: the exact points each event contributed (after
 * decay), the per-type breakdown, and the derived metrics. computeScore is a
 * thin projection of this, so the number a worker sees always matches the ledger.
 */
export function explainScore(
  events: ScoreEventInput[],
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): ScoreExplanation {
  const counts: Record<string, number> = {};
  const breakdown: Record<string, number> = {};
  const explained: ScoreExplanation["events"] = [];
  let raw = 0;

  // Process oldest-first so decay reflects order of accumulation.
  const ordered = [...events].sort(
    (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
  );

  for (const event of ordered) {
    const base =
      event.type === "MANUAL_ADJUSTMENT"
        ? (event.weight ?? 0) * config.weights.MANUAL_ADJUSTMENT
        : config.weights[event.type];

    const seen = counts[event.type] ?? 0;
    // Diminishing returns only apply to positive, non-manual signals.
    const decay =
      base > 0 && event.type !== "MANUAL_ADJUSTMENT"
        ? Math.pow(1 - config.decayPerRepeat, seen)
        : 1;

    const contribution = Math.round(base * decay);
    raw += contribution;
    breakdown[event.type] = (breakdown[event.type] ?? 0) + contribution;
    counts[event.type] = seen + 1;
    explained.push({ type: event.type, points: contribution, createdAt: event.createdAt });
  }

  const score = Math.max(config.min, Math.min(config.max, Math.round(raw)));

  const jobsCompleted = counts.JOB_COMPLETED ?? 0;
  const onTime = counts.JOB_ON_TIME ?? 0;
  const noShow = counts.JOB_NO_SHOW ?? 0;
  const attendanceDenom = jobsCompleted + noShow;

  return {
    score,
    tier: tierFor(score, config),
    jobsCompleted,
    onTimeRate: attendanceDenom === 0 ? 0 : onTime / attendanceDenom,
    salesCount: counts.SALE_LOGGED ?? 0,
    breakdown,
    counts,
    events: explained,
  };
}

export function computeScore(
  events: ScoreEventInput[],
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): ScoreResult {
  const { counts: _c, events: _e, ...result } = explainScore(events, config);
  return result;
}

/** Loan gating: is a user eligible for a product requiring a min score/tier? */
export function meetsThreshold(
  result: Pick<ScoreResult, "score" | "tier">,
  minScore: number,
  minTier: ScoreTier,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
): boolean {
  const order: ScoreTier[] = ["BUILDING", "EMERGING", "TRUSTED", "ESTABLISHED"];
  const tierOk = order.indexOf(result.tier) >= order.indexOf(minTier);
  return result.score >= minScore && tierOk;
}
