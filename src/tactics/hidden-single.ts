import { BOARD_SIZE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";

/** Digit appears as candidate in only one cell of a house. */
export const hiddenSingleTactic: Tactic = {
  id: "hidden-single",
  title: "Single Candidate Strategy",
  score: 8,
  rank: 1.5,
  type: "value",
  find(state: GridState) {
    for (const group of HOUSES) {
      for (const house of group) {
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
          const cells: number[] = [];
          for (const idx of house) {
            if (state.values[idx] !== 0) continue;
            if (hasDigit(state.candidates[idx], digit)) cells.push(idx);
            if (cells.length > 1) break;
          }
          if (cells.length === 1) {
            return step(
              { title: "Single Candidate Strategy", type: "value" },
              [{ index: cells[0], filledValue: digit }],
              {
                patternCells: [cells[0]],
                regionCells: [...house],
              },
            );
          }
        }
      }
    }
    return null;
  },
};
