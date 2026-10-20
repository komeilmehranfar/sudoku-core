import { CELL_COUNT } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";

/**
 * BUG+1: all unsolved cells are bivalue except exactly one with three
 * candidates. Place the digit that appears three times among the three
 * houses of that cell (the "plus one" digit).
 */
export const bugPlusOneTactic: Tactic = {
  id: "bug-plus-one",
  title: "BUG+1 Strategy",
  score: 240,
  rank: 5.1,
  type: "value",
  find(state: GridState) {
    const tri: number[] = [];
    let bivalueCount = 0;
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      const n = candidateCount(state.candidates[i]);
      if (n === 2) bivalueCount++;
      else if (n === 3) tri.push(i);
      else return null;
    }
    if (tri.length !== 1 || bivalueCount === 0) return null;

    const cell = tri[0];
    const digits = digitsFromMask(state.candidates[cell]);

    for (const digit of digits) {
      // Count occurrences of digit in each of the three houses; BUG+1 digit
      // appears an odd number of times in all three (typically thrice total pattern)
      const [r, c, b] = [
        HOUSES[0][Math.floor(cell / 9)],
        HOUSES[1][cell % 9],
        HOUSES[2][
          Math.floor(Math.floor(cell / 9) / 3) * 3 + Math.floor((cell % 9) / 3)
        ],
      ];
      const oddInAll = [r, c, b].every((house) => {
        let count = 0;
        for (const idx of house) {
          if (state.values[idx] !== 0) continue;
          if (hasDigit(state.candidates[idx], digit)) count++;
        }
        return count % 2 === 1;
      });
      if (oddInAll) {
        return step(
          { title: "BUG+1 Strategy", type: "value" },
          [{ index: cell, filledValue: digit }],
          {
            patternCells: [cell],
            regionCells: regionFromCells([cell]),
          },
        );
      }
    }
    return null;
  },
};
