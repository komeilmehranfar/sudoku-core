import { BOARD_SIZE } from "../board/constants";
import { digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";

export const hiddenPairTactic: Tactic = {
  id: "hidden-pair",
  title: "Hidden Pair Strategy",
  score: 90,
  rank: 3.4,
  type: "elimination",
  find(state: GridState) {
    for (const group of HOUSES) {
      for (const house of group) {
        const digitCells: number[][] = Array.from({ length: 10 }, () => []);
        for (const idx of house) {
          if (state.values[idx] !== 0) continue;
          for (const d of digitsFromMask(state.candidates[idx])) {
            digitCells[d].push(idx);
          }
        }

        for (let d1 = 1; d1 <= BOARD_SIZE; d1++) {
          if (digitCells[d1].length !== 2) continue;
          for (let d2 = d1 + 1; d2 <= BOARD_SIZE; d2++) {
            if (digitCells[d2].length !== 2) continue;
            const a = digitCells[d1];
            const b = digitCells[d2];
            if (a[0] !== b[0] || a[1] !== b[1]) continue;

            const updates: {
              index: number;
              eliminatedCandidate: number;
            }[] = [];
            for (const idx of a) {
              for (let d = 1; d <= BOARD_SIZE; d++) {
                if (d === d1 || d === d2) continue;
                if (hasDigit(state.candidates[idx], d)) {
                  updates.push({ index: idx, eliminatedCandidate: d });
                }
              }
            }
            if (updates.length > 0) {
              return step(
                { title: "Hidden Pair Strategy", type: "elimination" },
                updates,
                {
                  patternCells: [a[0], a[1]],
                  patternDigits: [d1, d2],
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
