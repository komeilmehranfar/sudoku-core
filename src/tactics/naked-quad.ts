import {
  candidateCount,
  digitsFromMask,
  hasDigit,
  maskFromDigits,
} from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";

/** Four cells in a house whose candidates are within a 4-digit set. */
export const nakedQuadTactic: Tactic = {
  id: "naked-quad",
  title: "Naked Quadruple Strategy",
  score: 120,
  rank: 3.8,
  type: "elimination",
  find(state: GridState) {
    for (const group of HOUSES) {
      for (const house of group) {
        const cells = house.filter(
          (idx) =>
            state.values[idx] === 0 &&
            candidateCount(state.candidates[idx]) >= 2 &&
            candidateCount(state.candidates[idx]) <= 4,
        );

        for (let a = 0; a < cells.length; a++) {
          for (let b = a + 1; b < cells.length; b++) {
            for (let c = b + 1; c < cells.length; c++) {
              for (let d = c + 1; d < cells.length; d++) {
                const idxs = [cells[a], cells[b], cells[c], cells[d]];
                const union = maskFromDigits(
                  idxs.flatMap((i) => digitsFromMask(state.candidates[i])),
                );
                if (candidateCount(union) !== 4) continue;

                const digits = digitsFromMask(union);
                const locked = new Set(idxs);
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
                    {
                      title: "Naked Quadruple Strategy",
                      type: "elimination",
                    },
                    updates,
                    {
                      patternCells: idxs,
                      patternDigits: digits,
                      regionCells: [...house],
                    },
                  );
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};
