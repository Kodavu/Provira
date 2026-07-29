import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  computeScore,
  DEFAULT_SCORE_CONFIG,
  ScoreEventInput,
} from "@tally/core";
import type { ScoreEventType } from "@tally/db";

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
}
