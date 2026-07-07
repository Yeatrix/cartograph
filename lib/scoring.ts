// ─── Depth Score ─────────────────────────────────────────────────────────────
// score = accuracy × novelty factor × terrain difficulty  (×100 for whole points)
// Pure function → unit-testable, and the single source of truth for the
// leaderboard's credibility. Never computed client-side.
import { Tier } from "./types";

const TIER_WEIGHTS: Record<Tier, number> = {
  recall: 0.25,  // did you read it?
  reframe: 0.35, // can you say it in your own words?
  apply: 0.4     // does it touch your life?
};

export function depthScore(
  passed: Record<Tier, boolean | null>,
  applyNovelty: number | null,
  difficultyMultiplier: number
): number {
  let accuracy = 0;
  (Object.keys(TIER_WEIGHTS) as Tier[]).forEach((t) => {
    if (passed[t]) accuracy += TIER_WEIGHTS[t];
  });
  // Novelty softens rather than dominates: floor of 0.6 even for a flat answer.
  const noveltyFactor = 0.6 + 0.4 * (applyNovelty ?? 0.5);
  return Math.round(100 * accuracy * noveltyFactor * difficultyMultiplier);
}
