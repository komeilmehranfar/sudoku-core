import { CELL_COUNT, STEP_TYPE } from "../board/constants";
import { singleDigit } from "../board/candidates";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

/** Cell with only one candidate. */
export const nakedSingleTactic: Tactic = {
  id: TACTIC_ID.NAKED_SINGLE,
  title: STRATEGY.NAKED_SINGLE,
  score: 9,
  rank: 2.3,
  type: STEP_TYPE.VALUE,
  find(state: GridState) {
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      const digit = singleDigit(state.candidates[i]);
      if (digit == null) continue;
      return step(
        { title: STRATEGY.NAKED_SINGLE, type: STEP_TYPE.VALUE },
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
