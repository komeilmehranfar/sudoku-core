import { BOARD_SIZE } from "../board/constants";
import { digitsFromMask } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";

/** Last empty cell in a house → remaining digit. */
export const openSinglesTactic: Tactic = {
  id: "open-singles",
  title: "Open Singles Strategy",
  score: 0.1,
  rank: 1.0,
  type: "value",
  find(state: GridState) {
    for (const group of HOUSES) {
      for (const house of group) {
        const empty: number[] = [];
        const used = new Set<number>();
        for (const idx of house) {
          const v = state.values[idx];
          if (v === 0) empty.push(idx);
          else used.add(v);
        }
        if (empty.length !== 1) continue;
        const remaining: number[] = [];
        for (let d = 1; d <= BOARD_SIZE; d++) {
          if (!used.has(d)) remaining.push(d);
        }
        if (remaining.length !== 1) continue;
        const index = empty[0];
        if (!digitsFromMask(state.candidates[index]).includes(remaining[0])) {
          continue;
        }
        return step(
          { title: "Open Singles Strategy", type: "value" },
          [{ index, filledValue: remaining[0] }],
          {
            patternCells: [index],
            regionCells: [...house],
          },
        );
      }
    }
    return null;
  },
};
