// Job-worker matching: a pure, explainable ranking function. The API layer
// fetches candidate workers + the job, hands plain objects here, and persists
// the returned matchScore onto JobAssignment rows.

export interface MatchWeights {
  skill: number;
  location: number;
  language: number;
  reliability: number;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  skill: 0.4,
  location: 0.25,
  language: 0.15,
  reliability: 0.2,
};

export interface JobCriteria {
  skillSlugs: string[];
  languages: string[]; // acceptable languages
  lat?: number | null;
  lng?: number | null;
}

export interface WorkerCandidate {
  workerId: string;
  skillSlugs: string[];
  languages: string[];
  lat?: number | null;
  lng?: number | null;
  score: number; // reliability score
  scoreMax: number; // config max for normalization
}

export interface MatchResult {
  workerId: string;
  matchScore: number; // 0..1
  reasons: Record<keyof MatchWeights, number>;
}

// Haversine distance in km.
function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function overlap(a: string[], b: string[]): number {
  if (a.length === 0) return 1; // no requirement => full credit
  const set = new Set(b);
  const hits = a.filter((x) => set.has(x)).length;
  return hits / a.length;
}

export function rankWorkers(
  job: JobCriteria,
  candidates: WorkerCandidate[],
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
): MatchResult[] {
  return candidates
    .map((c) => {
      const skill = overlap(job.skillSlugs, c.skillSlugs);
      const language = overlap(job.languages, c.languages);

      let location = 0.5; // neutral when geo is missing
      if (
        job.lat != null &&
        job.lng != null &&
        c.lat != null &&
        c.lng != null
      ) {
        const d = distanceKm(job.lat, job.lng, c.lat, c.lng);
        // Full credit within 5km, linearly down to 0 at 50km.
        location = Math.max(0, Math.min(1, 1 - (d - 5) / 45));
      }

      const reliability = c.scoreMax > 0 ? c.score / c.scoreMax : 0;

      const reasons = {
        skill: skill * weights.skill,
        location: location * weights.location,
        language: language * weights.language,
        reliability: reliability * weights.reliability,
      };
      const matchScore =
        reasons.skill + reasons.location + reasons.language + reasons.reliability;

      return { workerId: c.workerId, matchScore, reasons };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
