import { BOARD_SIZE, STEP_TYPE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";
import type { SolvingStep } from "../types";
import { STRATEGY, TACTIC_ID, type Strategy } from "./names";

/**
 * Basic fish of size N (2=X-Wing, 3=Swordfish, 4=Jellyfish):
 * N primary lines where digit appears in 2..N secondaries, union of
 * secondaries has size N → eliminate digit from those secondaries elsewhere.
 */
export function findBasicFish(
  state: GridState,
  size: 2 | 3 | 4,
  title: Strategy,
): SolvingStep | null {
  const rowHit = findFishOrientation(state, size, 0, 1, title);
  if (rowHit) return rowHit;
  return findFishOrientation(state, size, 1, 0, title);
}

function findFishOrientation(
  state: GridState,
  size: 2 | 3 | 4,
  primaryType: 0 | 1,
  secondaryType: 0 | 1,
  title: Strategy,
): SolvingStep | null {
  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    const lines: { line: number; seconds: number[] }[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const house = HOUSES[primaryType][i];
      const seconds: number[] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        const idx = house[j];
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) seconds.push(j);
      }
      if (seconds.length >= 2 && seconds.length <= size) {
        lines.push({ line: i, seconds });
      }
    }
    if (lines.length < size) continue;

    const combo = combinations(lines.length, size);
    for (const idxs of combo) {
      const chosen = idxs.map((i) => lines[i]);
      const secondarySet = new Set<number>();
      for (const line of chosen) {
        for (const s of line.seconds) secondarySet.add(s);
      }
      if (secondarySet.size !== size) continue;

      const primarySet = new Set(chosen.map((c) => c.line));
      const updates: { index: number; eliminatedCandidate: number }[] = [];
      for (const sec of secondarySet) {
        const house = HOUSES[secondaryType][sec];
        for (let p = 0; p < BOARD_SIZE; p++) {
          if (primarySet.has(p)) continue;
          const idx = house[p];
          if (state.values[idx] !== 0) continue;
          if (hasDigit(state.candidates[idx], digit)) {
            updates.push({ index: idx, eliminatedCandidate: digit });
          }
        }
      }
      if (updates.length > 0) {
        const patternCells: number[] = [];
        for (const line of chosen) {
          for (const s of line.seconds) {
            const idx =
              primaryType === 0
                ? line.line * BOARD_SIZE + s
                : s * BOARD_SIZE + line.line;
            patternCells.push(idx);
          }
        }
        const regionCells = [
          ...new Set([
            ...chosen.flatMap((c) => [...HOUSES[primaryType][c.line]]),
            ...[...secondarySet].flatMap((s) => [...HOUSES[secondaryType][s]]),
          ]),
        ];
        return step({ title, type: STEP_TYPE.ELIMINATION }, updates, {
          patternCells,
          regionCells,
        });
      }
    }
  }
  return null;
}

function combinations(n: number, k: number): number[][] {
  const result: number[][] = [];
  const cur: number[] = [];
  function dfs(start: number) {
    if (cur.length === k) {
      result.push(cur.slice());
      return;
    }
    for (let i = start; i < n; i++) {
      cur.push(i);
      dfs(i + 1);
      cur.pop();
    }
  }
  dfs(0);
  return result;
}

export const xWingTactic: Tactic = {
  id: TACTIC_ID.X_WING,
  title: STRATEGY.X_WING,
  score: 120,
  rank: 3.2,
  type: STEP_TYPE.ELIMINATION,
  find(state) {
    return findBasicFish(state, 2, STRATEGY.X_WING);
  },
};

export const swordfishTactic: Tactic = {
  id: TACTIC_ID.SWORDFISH,
  title: STRATEGY.SWORDFISH,
  score: 200,
  rank: 3.8,
  type: STEP_TYPE.ELIMINATION,
  find(state) {
    return findBasicFish(state, 3, STRATEGY.SWORDFISH);
  },
};

export const jellyfishTactic: Tactic = {
  id: TACTIC_ID.JELLYFISH,
  title: STRATEGY.JELLYFISH,
  score: 280,
  rank: 5.2,
  type: STEP_TYPE.ELIMINATION,
  find(state) {
    return findBasicFish(state, 4, STRATEGY.JELLYFISH);
  },
};
