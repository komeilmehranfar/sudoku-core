import { BOARD_SIZE, STEP_TYPE } from "../board/constants";
import { digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID, type Strategy } from "./names";

/**
 * Hidden Triple / Quad ("Hidden Groups"):
 * N digits that appear only in N cells of a house → strip other candidates
 * from those cells.
 */
function findHiddenGroup(state: GridState, size: 3 | 4, title: Strategy) {
  for (const group of HOUSES) {
    for (const house of group) {
      const digitCells: number[][] = Array.from({ length: 10 }, () => []);
      for (const idx of house) {
        if (state.values[idx] !== 0) continue;
        for (const d of digitsFromMask(state.candidates[idx])) {
          digitCells[d].push(idx);
        }
      }

      const digits: number[] = [];
      for (let d = 1; d <= BOARD_SIZE; d++) {
        if (digitCells[d].length >= 1 && digitCells[d].length <= size) {
          digits.push(d);
        }
      }
      if (digits.length < size) continue;

      const combos = combinations(digits.length, size);
      for (const idxs of combos) {
        const chosen = idxs.map((i) => digits[i]);
        const cells = new Set<number>();
        for (const d of chosen) {
          for (const c of digitCells[d]) cells.add(c);
        }
        if (cells.size !== size) continue;

        const updates: { index: number; eliminatedCandidate: number }[] = [];
        const digitSet = new Set(chosen);
        for (const idx of cells) {
          for (let d = 1; d <= BOARD_SIZE; d++) {
            if (digitSet.has(d)) continue;
            if (hasDigit(state.candidates[idx], d)) {
              updates.push({ index: idx, eliminatedCandidate: d });
            }
          }
        }
        if (updates.length > 0) {
          return step({ title, type: STEP_TYPE.ELIMINATION }, updates, {
            patternCells: [...cells],
            patternDigits: chosen,
            regionCells: [...house],
          });
        }
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

export const hiddenTripleTactic: Tactic = {
  id: TACTIC_ID.HIDDEN_TRIPLE,
  title: STRATEGY.HIDDEN_TRIPLE,
  score: 100,
  rank: 3.5,
  type: STEP_TYPE.ELIMINATION,
  find(state) {
    return findHiddenGroup(state, 3, STRATEGY.HIDDEN_TRIPLE);
  },
};

export const hiddenQuadTactic: Tactic = {
  id: TACTIC_ID.HIDDEN_QUAD,
  title: STRATEGY.HIDDEN_QUAD,
  score: 140,
  rank: 3.7,
  type: STEP_TYPE.ELIMINATION,
  find(state) {
    return findHiddenGroup(state, 4, STRATEGY.HIDDEN_QUAD);
  },
};

/** "Hidden Groups" entry point — try triple then quad. */
export const hiddenGroupsTactic: Tactic = {
  id: TACTIC_ID.HIDDEN_GROUPS,
  title: STRATEGY.HIDDEN_GROUPS,
  score: 100,
  rank: 3.5,
  type: STEP_TYPE.ELIMINATION,
  find(state) {
    return (
      findHiddenGroup(state, 3, STRATEGY.HIDDEN_GROUPS) ??
      findHiddenGroup(state, 4, STRATEGY.HIDDEN_GROUPS)
    );
  },
};
