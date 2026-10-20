import {
  DIFFICULTIES,
  DIFFICULTY_L1,
  DIFFICULTY_L2,
  DIFFICULTY_L3,
  DIFFICULTY_L4,
  DIFFICULTY_L5,
  DIFFICULTY_L6,
  DIFFICULTY_L7,
  DIFFICULTY_L8,
  DIFFICULTY_L9,
  DIFFICULTY_L10,
  STEP_TYPE,
} from "../board/constants";
import { TACTICS, tacticByTitle } from "../tactics/registry";
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
  [DIFFICULTY_L1]: 80,
  [DIFFICULTY_L2]: 150,
  [DIFFICULTY_L3]: 900,
  [DIFFICULTY_L4]: 700,
  [DIFFICULTY_L5]: 1100,
  [DIFFICULTY_L6]: 1400,
  [DIFFICULTY_L7]: 2000,
  [DIFFICULTY_L8]: 2600,
  [DIFFICULTY_L9]: 3400,
  [DIFFICULTY_L10]: Infinity,
};

export function rateSteps(steps: SolvingStep[]): RatingBreakdown {
  const freq = new Map<string, number>();
  let hardestRank = 0;
  let hardestTechnique: string | undefined;
  let placements = 0;

  for (const s of steps) {
    freq.set(s.strategy, (freq.get(s.strategy) ?? 0) + 1);
    if (s.type === STEP_TYPE.VALUE) placements += s.updates.length;
    const tactic = tacticByTitle(s.strategy);
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

/** Minimum hardest-technique rank for each band, hardest first (below 1.5 is L1). */
const RANK_FLOOR: ReadonlyArray<readonly [number, Difficulty]> = [
  [7.0, DIFFICULTY_L10],
  [5.0, DIFFICULTY_L9],
  [4.2, DIFFICULTY_L8],
  [3.9, DIFFICULTY_L7],
  [3.2, DIFFICULTY_L6],
  [3.0, DIFFICULTY_L5],
  [2.6, DIFFICULTY_L4],
  [2.3, DIFFICULTY_L3],
  [1.5, DIFFICULTY_L2],
];

/**
 * L1–L10 from hardest technique rank, with optional grind bump.
 *
 * L1  open singles
 * L2  hidden singles
 * L3  naked singles
 * L4  locked candidates (pointing)
 * L5  naked pair
 * L6  X-Wing / hidden pair / triples / quads / swordfish
 * L7  turbot family (skyscraper, kite, crane)
 * L8  wings (incl. WXYZ) / ER / colouring / UR / finned X-Wing
 * L9  jellyfish / finned swordfish & jellyfish / BUG+1 / chains
 * L10 AIC / Medusa / Nishio
 */
export function mapDifficulty(hardestRank: number, score: number): Difficulty {
  let level: Difficulty =
    RANK_FLOOR.find(([floor]) => hardestRank >= floor)?.[1] ?? DIFFICULTY_L1;

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
