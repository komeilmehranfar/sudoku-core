import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";
import { STEP_TYPE } from "../board/constants";

export const nakedPairTactic: Tactic = {
  id: TACTIC_ID.NAKED_PAIR,
  title: STRATEGY.NAKED_PAIR,
  score: 50,
  rank: 3.0,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    for (const group of HOUSES) {
      for (const house of group) {
        const pairCells: { index: number; mask: number }[] = [];
        for (const idx of house) {
          if (state.values[idx] !== 0) continue;
          if (candidateCount(state.candidates[idx]) === 2) {
            pairCells.push({ index: idx, mask: state.candidates[idx] });
          }
        }

        for (let a = 0; a < pairCells.length; a++) {
          for (let b = a + 1; b < pairCells.length; b++) {
            if (pairCells[a].mask !== pairCells[b].mask) continue;
            const digits = digitsFromMask(pairCells[a].mask);
            const locked = new Set([pairCells[a].index, pairCells[b].index]);
            const updates: {
              index: number;
              eliminatedCandidate: number;
            }[] = [];

            for (const idx of house) {
              if (locked.has(idx) || state.values[idx] !== 0) continue;
              for (const digit of digits) {
                if (hasDigit(state.candidates[idx], digit)) {
                  updates.push({ index: idx, eliminatedCandidate: digit });
                }
              }
            }

            if (updates.length > 0) {
              return step(
                { title: STRATEGY.NAKED_PAIR, type: STEP_TYPE.ELIMINATION },
                updates,
                {
                  patternCells: [pairCells[a].index, pairCells[b].index],
                  patternDigits: digits,
                  regionCells: [...house],
                },
              );
            }
          }
        }
      }
    }
    return null;
  },
};
