import {
  candidateCount,
  digitsFromMask,
  hasDigit,
  maskFromDigits,
} from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";

/** Three cells in a house whose candidates are within a 3-digit set. */
export const nakedTripleTactic: Tactic = {
  id: "naked-triple",
  title: "Naked Triplet Strategy",
  score: 100,
  rank: 3.6,
  type: "elimination",
  find(state: GridState) {
    for (const group of HOUSES) {
      for (const house of group) {
        const cells = house.filter(
          (idx) =>
            state.values[idx] === 0 &&
            candidateCount(state.candidates[idx]) >= 2 &&
            candidateCount(state.candidates[idx]) <= 3,
        );

        for (let a = 0; a < cells.length; a++) {
          for (let b = a + 1; b < cells.length; b++) {
            for (let c = b + 1; c < cells.length; c++) {
              const union = maskFromDigits([
                ...digitsFromMask(state.candidates[cells[a]]),
                ...digitsFromMask(state.candidates[cells[b]]),
                ...digitsFromMask(state.candidates[cells[c]]),
              ]);
              if (candidateCount(union) !== 3) continue;

              const digits = digitsFromMask(union);
              const locked = new Set([cells[a], cells[b], cells[c]]);
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
                  { title: "Naked Triplet Strategy", type: "elimination" },
                  updates,
                  {
                    patternCells: [cells[a], cells[b], cells[c]],
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
    return null;
  },
};
