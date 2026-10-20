import { BOARD_SIZE, STEP_TYPE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { CELL_HOUSES, HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

/**
 * Pointing / claiming: digit candidates in a box confined to a row/col
 * (or vice versa) → eliminate outside the intersection.
 */
export const pointingEliminationTactic: Tactic = {
  id: TACTIC_ID.POINTING_ELIMINATION,
  title: STRATEGY.POINTING_ELIMINATION,
  score: 80,
  rank: 2.6,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    for (let houseType = 0; houseType < 3; houseType++) {
      for (let houseIndex = 0; houseIndex < BOARD_SIZE; houseIndex++) {
        const house = HOUSES[houseType][houseIndex];
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
          const cells: number[] = [];
          for (const idx of house) {
            if (state.values[idx] !== 0) continue;
            if (hasDigit(state.candidates[idx], digit)) cells.push(idx);
          }
          if (cells.length < 2) continue;

          let sameAlt = true;
          let sameAltTwo = true;
          let altId = -1;
          let altTwoId = -1;

          for (const cell of cells) {
            const houses = CELL_HOUSES[cell];
            const newAlt = houseType === 2 ? houses[0] : houses[2];
            const newAltTwo = houseType === 2 ? houses[1] : houses[2];
            if (altId === -1) {
              altId = newAlt;
              altTwoId = newAltTwo;
            } else {
              if (newAlt !== altId) sameAlt = false;
              if (newAltTwo !== altTwoId) sameAltTwo = false;
            }
          }

          if (!sameAlt && !sameAltTwo) continue;

          const altHouseType = houseType === 2 ? (sameAlt ? 0 : 1) : 2;
          const altHouse =
            HOUSES[altHouseType][CELL_HOUSES[cells[0]][altHouseType]];
          const cellSet = new Set(cells);
          const updates: { index: number; eliminatedCandidate: number }[] = [];

          for (const idx of altHouse) {
            if (cellSet.has(idx)) continue;
            if (state.values[idx] !== 0) continue;
            if (!hasDigit(state.candidates[idx], digit)) continue;
            updates.push({ index: idx, eliminatedCandidate: digit });
          }

          if (updates.length > 0) {
            return step(
              {
                title: STRATEGY.POINTING_ELIMINATION,
                type: STEP_TYPE.ELIMINATION,
              },
              updates,
              {
                patternCells: cells,
                patternDigits: [digit],
                regionCells: [...new Set([...house, ...altHouse])],
              },
            );
          }
        }
      }
    }
    return null;
  },
};
