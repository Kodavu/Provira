// Reliability score configuration. EVERYTHING tunable lives here so the score
// is transparent and adjustable without touching the engine logic. Change these
// values (or load them from env/DB later) to re-weight the model.

export type ScoreTier = "BUILDING" | "EMERGING" | "TRUSTED" | "ESTABLISHED";

export interface ScoreConfig {
  /** Score range. We use 0..1000 for granularity. */
  min: number;
  max: number;
  /** Points contributed per signal type. Negative = penalty. */
  weights: {
    JOB_COMPLETED: number;
    JOB_ON_TIME: number; // bonus on top of completion
    JOB_NO_SHOW: number; // penalty
    SALE_LOGGED: number;
    LOAN_REPAID_ON_TIME: number;
    LOAN_DEFAULT: number; // penalty
    DISPUTE_RAISED: number; // penalty
    MANUAL_ADJUSTMENT: number; // multiplier applied to event.weight
  };
  /** Diminishing returns: repeated same-type signals count a bit less. */
  decayPerRepeat: number; // 0 = no decay, 0.02 = each repeat worth 2% less
  /** Lower-inclusive score at which each tier begins. */
  tierThresholds: Record<ScoreTier, number>;
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  min: 0,
  max: 1000,
  weights: {
    JOB_COMPLETED: 25,
    JOB_ON_TIME: 10,
    JOB_NO_SHOW: -40,
    SALE_LOGGED: 3,
    LOAN_REPAID_ON_TIME: 40,
    LOAN_DEFAULT: -120,
    DISPUTE_RAISED: -30,
    MANUAL_ADJUSTMENT: 1,
  },
  decayPerRepeat: 0.015,
  tierThresholds: {
    BUILDING: 0,
    EMERGING: 250,
    TRUSTED: 500,
    ESTABLISHED: 750,
  },
};
