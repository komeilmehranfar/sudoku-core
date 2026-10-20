import { DIFFICULTIES } from "../board/constants";
import { TACTICS } from "../tactics/registry";
import type { SolvingStep, Difficulty } from "../types";

export interface RatingBreakdown {
  score: number;
  difficulty: Difficulty;
  hardestTechnique: string | undefined;
  hardestRank: number;
  usedStrategies: Array<{ title: string; freq: number }>;
  /** Rough tedium: steps per placement (higher = more grinding) */
  tedium: number;
}

/**
 * Score caps that bump a puzzle one level within its technique band.
 * Mid bands are high so grind alone rarely promotes past the technique floor
 * (e.g. naked-single grind ≠ L4, naked-pair grind ≠ L6).
 */
const SCORE_BUMP: Record<Difficulty, number> = {
  L1: 80,
  L2: 150,
  L3: 900,
  L4: 700,
  L5: 1100,
  L6: 1400,
  L7: 2000,
  L8: 2600,
  L9: 3400,
  L10: Infinity,
};

export function rateSteps(steps: SolvingStep[]): RatingBreakdown {
  const freq = new Map<string, number>();
  let hardestRank = 0;
  let hardestTechnique: string | undefined;
  let placements = 0;

  for (const s of steps) {
    freq.set(s.strategy, (freq.get(s.strategy) ?? 0) + 1);
    if (s.type === "value") placements += s.updates.length;
    const tactic = TACTICS.find((t) => t.title === s.strategy);
    if (tactic && tactic.rank >= hardestRank) {
      hardestRank = tactic.rank;
      hardestTechnique = tactic.title;
    }
  }

  let score = 0;
  const usedStrategies: Array<{ title: string; freq: number }> = [];
  for (const tactic of TACTICS) {
    const f = freq.get(tactic.title) ?? 0;
    if (f === 0) continue;
    score += f * tactic.score;
    usedStrategies.push({ title: tactic.title, freq: f });
  }

  const tedium =
    placements === 0
      ? steps.length
      : Math.round((steps.length / placements) * 100) / 100;

  const difficulty = mapDifficulty(hardestRank, score);

  return {
    score: Math.round(score * 10) / 10,
    difficulty,
    hardestTechnique,
    hardestRank,
    usedStrategies,
    tedium,
  };
}

/**
 * L1–L10 from hardest technique rank, with optional grind bump.
 *
 * L1  open singles
 * L2  hidden singles
 * L3  naked singles
 * L4  locked candidates (pointing)
 * L5  naked pair
 * L6  X-Wing / hidden pair / triples / quads
 * L7  turbot family / swordfish
 * L8  wings / ER / colouring / UR / finned X-Wing
 * L9  jellyfish / chains / BUG+1 / WXYZ
 * L10 AIC / Medusa / Nishio
 */
export function mapDifficulty(hardestRank: number, score: number): Difficulty {
  let level: Difficulty =
    hardestRank >= 7.0
      ? "L10"
      : hardestRank >= 5.0
        ? "L9"
        : hardestRank >= 4.2
          ? "L8"
          : hardestRank >= 3.9
            ? "L7"
            : hardestRank >= 3.2
              ? "L6"
              : hardestRank >= 3.0
                ? "L5"
                : hardestRank >= 2.6
                  ? "L4"
                  : hardestRank >= 2.3
                    ? "L3"
                    : hardestRank >= 1.5
                      ? "L2"
                      : "L1";

  if (score > SCORE_BUMP[level]) {
    const idx = difficultyIndex(level);
    if (idx < DIFFICULTIES.length - 1) level = DIFFICULTIES[idx + 1];
  }

  return level;
}

export function difficultyIndex(d: Difficulty): number {
  return DIFFICULTIES.indexOf(d);
}

export function isAtMost(actual: Difficulty, max: Difficulty): boolean {
  return difficultyIndex(actual) <= difficultyIndex(max);
}

export function isAtLeast(actual: Difficulty, min: Difficulty): boolean {
  return difficultyIndex(actual) >= difficultyIndex(min);
}
