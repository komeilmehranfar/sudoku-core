import { CELL_COUNT } from "../board/constants";
import { candidateCount, hasDigit } from "../board/candidates";
import { CELL_HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";

/**
 * Unique Rectangle Type 1:
 * Four cells at the corners of a rectangle spanning two boxes.
 * Digits A,B appear in all four; three cells are bi-value {A,B};
 * the fourth has extras → eliminate A and B from the fourth.
 */
export const uniqueRectangleTactic: Tactic = {
  id: "unique-rectangle",
  title: "Unique Rectangle Strategy",
  score: 200,
  rank: 4.8,
  type: "elimination",
  find(state: GridState) {
    const empties: number[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] === 0) empties.push(i);
    }

    for (let i = 0; i < empties.length; i++) {
      for (let j = i + 1; j < empties.length; j++) {
        const a = empties[i];
        const b = empties[j];
        const [ra, ca, ba] = CELL_HOUSES[a];
        const [rb, cb, bb] = CELL_HOUSES[b];
        if (ra === rb || ca === cb) continue;
        // Diagonal pair of potential rectangle
        const c = ra * 9 + cb;
        const d = rb * 9 + ca;
        if (state.values[c] !== 0 || state.values[d] !== 0) continue;
        const corners = [a, b, c, d];
        const boxes = new Set(corners.map((x) => CELL_HOUSES[x][2]));
        if (boxes.size !== 2) continue;
        void ba;
        void bb;

        // Digits A,B must be in all four cells
        for (let x = 1; x <= 9; x++) {
          for (let y = x + 1; y <= 9; y++) {
            if (!corners.every((idx) => hasDigit(state.candidates[idx], x)))
              continue;
            if (!corners.every((idx) => hasDigit(state.candidates[idx], y)))
              continue;

            const bivalue = corners.filter(
              (idx) =>
                candidateCount(state.candidates[idx]) === 2 &&
                hasDigit(state.candidates[idx], x) &&
                hasDigit(state.candidates[idx], y),
            );
            if (bivalue.length !== 3) continue;
            const floor = corners.find((idx) => !bivalue.includes(idx))!;
            if (candidateCount(state.candidates[floor]) <= 2) continue;

            const updates: { index: number; eliminatedCandidate: number }[] =
              [];
            for (const digit of [x, y]) {
              if (hasDigit(state.candidates[floor], digit)) {
                updates.push({ index: floor, eliminatedCandidate: digit });
              }
            }
            if (updates.length > 0) {
              return step(
                { title: "Unique Rectangle Strategy", type: "elimination" },
                updates,
                {
                  patternCells: corners,
                  regionCells: regionFromCells(corners),
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
