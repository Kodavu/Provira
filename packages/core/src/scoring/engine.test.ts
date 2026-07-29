import { describe, it, expect } from "vitest";
import { computeScore, meetsThreshold } from "./engine.js";

describe("computeScore", () => {
  it("starts a fresh user at BUILDING with score 0", () => {
    const r = computeScore([]);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("BUILDING");
  });

  it("accumulates completed + on-time jobs and derives on-time rate", () => {
    const r = computeScore([
      { type: "JOB_COMPLETED" },
      { type: "JOB_ON_TIME" },
      { type: "JOB_COMPLETED" },
      { type: "JOB_ON_TIME" },
    ]);
    expect(r.jobsCompleted).toBe(2);
    expect(r.onTimeRate).toBe(1);
    expect(r.score).toBeGreaterThan(0);
  });

  it("penalizes no-shows and defaults", () => {
    const good = computeScore([{ type: "LOAN_REPAID_ON_TIME" }]);
    const bad = computeScore([{ type: "LOAN_DEFAULT" }]);
    expect(bad.score).toBeLessThan(good.score);
    expect(bad.score).toBe(0); // clamped at floor
  });

  it("applies diminishing returns to repeated positive signals", () => {
    const one = computeScore([{ type: "JOB_COMPLETED" }]).score;
    const many = computeScore(
      Array.from({ length: 10 }, () => ({ type: "JOB_COMPLETED" as const })),
    ).score;
    expect(many).toBeLessThan(one * 10);
  });

  it("gates loans by score and tier", () => {
    const result = { score: 300, tier: "EMERGING" as const };
    expect(meetsThreshold(result, 250, "EMERGING")).toBe(true);
    expect(meetsThreshold(result, 250, "TRUSTED")).toBe(false);
    expect(meetsThreshold(result, 500, "EMERGING")).toBe(false);
  });
});
