import type { GridState } from "../board/board";
import type { STEP_TYPE, StepType } from "../board/constants";
import { CELL_HOUSES, HOUSES } from "../board/houses";
import type { SolvingStep, Update } from "../types";
import type { Strategy, TacticId } from "./names";

export type TacticFn = (state: GridState) => SolvingStep | null;

export interface Tactic {
  id: TacticId;
  title: Strategy;
  /** Relative human difficulty / usefulness cost */
  score: number;
  /** SE-like rank for hardest-technique rating (lower = easier) */
  rank: number;
  /** Tactics place digits or remove candidates; only teaching hints add notes. */
  type: Exclude<StepType, typeof STEP_TYPE.ADD>;
  find: TacticFn;
}

export interface StepTeaching {
  /** Technique nodes (pair cells, wing pivots, chain nodes, …) */
  patternCells?: number[];
  /** Digits that define the pattern (pair/triple digits, fish digit, …) */
  patternDigits?: number[];
  /** Houses / areas to shade for teaching hints */
  regionCells?: number[];
}

export function step(
  tactic: Pick<Tactic, "title" | "type">,
  updates: Update[],
  teaching?: StepTeaching,
): SolvingStep {
  return {
    strategy: tactic.title,
    updates,
    type: tactic.type,
    ...(teaching?.patternCells?.length
      ? { patternCells: teaching.patternCells }
      : {}),
    ...(teaching?.patternDigits?.length
      ? { patternDigits: teaching.patternDigits }
      : {}),
    ...(teaching?.regionCells?.length
      ? { regionCells: teaching.regionCells }
      : {}),
  };
}

/** Union of row+col+box for each cell — coarse region shade. */
export function regionFromCells(cells: readonly number[]): number[] {
  const set = new Set<number>();
  for (const c of cells) {
    const [r, col, b] = CELL_HOUSES[c];
    for (const idx of HOUSES[0][r]) set.add(idx);
    for (const idx of HOUSES[1][col]) set.add(idx);
    for (const idx of HOUSES[2][b]) set.add(idx);
  }
  return [...set];
}

/** Flatten specific houses into a region list. */
export function regionFromHouses(
  houses: Array<{ kind: 0 | 1 | 2; index: number }>,
): number[] {
  const set = new Set<number>();
  for (const h of houses) {
    for (const idx of HOUSES[h.kind][h.index]) set.add(idx);
  }
  return [...set];
}
