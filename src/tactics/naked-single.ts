import { CELL_COUNT } from "../board/constants";
import { singleDigit } from "../board/candidates";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";

/** Cell with only one candidate. */
export const nakedSingleTactic: Tactic = {
  id: "naked-single",
  title: "Visual Elimination Strategy",
  score: 9,
  rank: 2.3,
  type: "value",
  find(state: GridState) {
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      const digit = singleDigit(state.candidates[i]);
      if (digit == null) continue;
      return step(
        { title: "Visual Elimination Strategy", type: "value" },
        [{ index: i, filledValue: digit }],
        {
          patternCells: [i],
          regionCells: regionFromCells([i]),
        },
      );
    }
    return null;
  },
};
