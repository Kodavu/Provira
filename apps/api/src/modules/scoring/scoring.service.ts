import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  computeScore,
  explainScore,
  DEFAULT_SCORE_CONFIG,
  ScoreEventInput,
} from "@tally/core";
import type { ScoreEventType } from "@tally/db";

// Human labels for the score ledger.
const SCORE_LABELS: Record<string, string> = {
  JOB_COMPLETED: "Job completed",
  JOB_ON_TIME: "On-time bonus",
  JOB_NO_SHOW: "No-show",
  SALE_LOGGED: "Sale logged",
  LOAN_REPAID_ON_TIME: "Loan repaid on time",
  LOAN_DEFAULT: "Loan default",
  DISPUTE_RAISED: "Dispute raised",
  MANUAL_ADJUSTMENT: "Adjustment",
};
const TIER_ORDER = ["BUILDING", "EMERGING", "TRUSTED", "ESTABLISHED"] as const;

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a scoring signal (append-only) and recompute the cached profile.
   * In production the recompute is offloaded to a BullMQ worker; here we do it
   * inline for simplicity and determinism.
   */
  async recordEvent(params: {
    userId: string;
    type: ScoreEventType;
    weight?: number;
    refType?: string;
    refId?: string;
  }) {
    await this.prisma.scoreEvent.create({
      data: {
        userId: params.userId,
        type: params.type,
        weight: params.weight ?? 0,
        refType: params.refType,
        refId: params.refId,
      },
    });
    return this.recompute(params.userId);
  }

  /** Pure recompute from the full event log — replayable and auditable. */
  async recompute(userId: string) {
    const events = await this.prisma.scoreEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const input: ScoreEventInput[] = events.map((e) => ({
      type: e.type as ScoreEventInput["type"],
      weight: e.weight,
      createdAt: e.createdAt,
    }));

    const result = computeScore(input, DEFAULT_SCORE_CONFIG);

    return this.prisma.scoreProfile.upsert({
      where: { userId },
      create: {
        userId,
        score: result.score,
        tier: result.tier,
        jobsCompleted: result.jobsCompleted,
        onTimeRate: result.onTimeRate,
        salesCount: result.salesCount,
      },
      update: {
        score: result.score,
        tier: result.tier,
        jobsCompleted: result.jobsCompleted,
        onTimeRate: result.onTimeRate,
        salesCount: result.salesCount,
        lastComputedAt: new Date(),
      },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.scoreProfile.findUnique({ where: { userId } });
  }

  /**
   * The ledger behind the number: current score/tier, progress to the next
   * tier, aggregated factors (what moved the score), and the recent event feed
   * with the exact points each contributed. This is Tally's transparency edge —
   * we show the ledger, not just a number.
   */
  async breakdown(userId: string) {
    const events = await this.prisma.scoreEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const input: ScoreEventInput[] = events.map((e) => ({
      type: e.type as ScoreEventInput["type"],
      weight: e.weight,
      createdAt: e.createdAt,
    }));
    const ex = explainScore(input, DEFAULT_SCORE_CONFIG);

    const t = DEFAULT_SCORE_CONFIG.tierThresholds;
    const idx = TIER_ORDER.indexOf(ex.tier);
    const nextTier = TIER_ORDER[idx + 1] ?? null;
    const floor = t[ex.tier];
    const ceil = nextTier ? t[nextTier] : DEFAULT_SCORE_CONFIG.max;

    const factors = Object.entries(ex.breakdown)
      .map(([type, points]) => ({
        type,
        label: SCORE_LABELS[type] ?? type,
        count: ex.counts[type] ?? 0,
        points,
      }))
      .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

    const history = ex.events
      .slice()
      .reverse()
      .slice(0, 25)
      .map((e) => ({
        type: e.type,
        label: SCORE_LABELS[e.type] ?? e.type,
        points: e.points,
        at: e.createdAt,
      }));

    return {
      score: ex.score,
      tier: ex.tier,
      range: { min: DEFAULT_SCORE_CONFIG.min, max: DEFAULT_SCORE_CONFIG.max },
      progress: {
        nextTier,
        pointsToNext: nextTier ? Math.max(0, t[nextTier] - ex.score) : 0,
        floor,
        ceil,
      },
      metrics: {
        jobsCompleted: ex.jobsCompleted,
        onTimeRate: ex.onTimeRate,
        salesCount: ex.salesCount,
      },
      factors,
      history,
    };
  }
}
