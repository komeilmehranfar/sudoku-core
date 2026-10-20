import { BOARD_SIZE, BOX_SIZE, STEP_TYPE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

/**
 * Empty Rectangle + strong link:
 * Box has digit on one row R and one column C (L-shape).
 * A conjugate pair in another line that hits row R (or col C) forces
 * an elimination at the opposite corner.
 */
export const emptyRectangleTactic: Tactic = {
  id: TACTIC_ID.EMPTY_RECTANGLE,
  title: STRATEGY.EMPTY_RECTANGLE,
  score: 220,
  rank: 4.6,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    for (let digit = 1; digit <= BOARD_SIZE; digit++) {
      for (let box = 0; box < BOARD_SIZE; box++) {
        const er = findEmptyRectangle(state, box, digit);
        if (!er) continue;
        const { row: erRow, col: erCol } = er;
        const boxRow0 = Math.floor(box / BOX_SIZE) * BOX_SIZE;
        const boxCol0 = (box % BOX_SIZE) * BOX_SIZE;

        // Strong link in a column X ≠ erCol that includes (erRow, X)
        for (let xCol = 0; xCol < BOARD_SIZE; xCol++) {
          if (xCol === erCol) continue;
          if (xCol >= boxCol0 && xCol < boxCol0 + BOX_SIZE) continue;
          const hits = candidatesInCol(state, xCol, digit);
          if (hits.length !== 2) continue;
          const onErRow = hits.find((i) => Math.floor(i / 9) === erRow);
          if (onErRow == null) continue;
          const remote = hits.find((i) => i !== onErRow)!;
          const remoteRow = Math.floor(remote / 9);
          const target = remoteRow * 9 + erCol;
          if (state.values[target] !== 0) continue;
          if (!hasDigit(state.candidates[target], digit)) continue;
          // Don't eliminate inside the ER box on the ER itself aimlessly
          const tCol = erCol;
          const tRow = remoteRow;
          const inErBox =
            tRow >= boxRow0 &&
            tRow < boxRow0 + BOX_SIZE &&
            tCol >= boxCol0 &&
            tCol < boxCol0 + BOX_SIZE;
          if (inErBox) continue;
          const patternCells = [...candidatesInBox(state, box, digit), ...hits];
          return step(
            { title: STRATEGY.EMPTY_RECTANGLE, type: STEP_TYPE.ELIMINATION },
            [{ index: target, eliminatedCandidate: digit }],
            {
              patternCells: [...new Set(patternCells)],
              regionCells: [
                ...new Set([
                  ...HOUSES[2][box],
                  ...HOUSES[1][xCol],
                  ...HOUSES[1][erCol],
                  ...HOUSES[0][erRow],
                ]),
              ],
            },
          );
        }

        // Strong link in a row Y ≠ erRow that includes (Y, erCol)
        for (let yRow = 0; yRow < BOARD_SIZE; yRow++) {
          if (yRow === erRow) continue;
          if (yRow >= boxRow0 && yRow < boxRow0 + BOX_SIZE) continue;
          const hits = candidatesInRow(state, yRow, digit);
          if (hits.length !== 2) continue;
          const onErCol = hits.find((i) => i % 9 === erCol);
          if (onErCol == null) continue;
          const remote = hits.find((i) => i !== onErCol)!;
          const remoteCol = remote % 9;
          const target = erRow * 9 + remoteCol;
          if (state.values[target] !== 0) continue;
          if (!hasDigit(state.candidates[target], digit)) continue;
          const tRow = erRow;
          const tCol = remoteCol;
          const inErBox =
            tRow >= boxRow0 &&
            tRow < boxRow0 + BOX_SIZE &&
            tCol >= boxCol0 &&
            tCol < boxCol0 + BOX_SIZE;
          if (inErBox) continue;
          const patternCells = [...candidatesInBox(state, box, digit), ...hits];
          return step(
            { title: STRATEGY.EMPTY_RECTANGLE, type: STEP_TYPE.ELIMINATION },
            [{ index: target, eliminatedCandidate: digit }],
            {
              patternCells: [...new Set(patternCells)],
              regionCells: [
                ...new Set([
                  ...HOUSES[2][box],
                  ...HOUSES[0][yRow],
                  ...HOUSES[0][erRow],
                  ...HOUSES[1][erCol],
                ]),
              ],
            },
          );
        }
      }
    }
    return null;
  },
};

function candidatesInBox(
  state: GridState,
  box: number,
  digit: number,
): number[] {
  const hits: number[] = [];
  for (const idx of HOUSES[2][box]) {
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
  }
  return hits;
}

function findEmptyRectangle(
  state: GridState,
  box: number,
  digit: number,
): { row: number; col: number } | null {
  const positions: number[] = [];
  for (const idx of HOUSES[2][box]) {
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], digit)) positions.push(idx);
  }
  if (positions.length < 2) return null;

  const rows = [...new Set(positions.map((i) => Math.floor(i / 9)))];
  const cols = [...new Set(positions.map((i) => i % 9))];

  for (const r of rows) {
    for (const c of cols) {
      if (!positions.every((i) => Math.floor(i / 9) === r || i % 9 === c))
        continue;
      const onRowOnly = positions.some(
        (i) => Math.floor(i / 9) === r && i % 9 !== c,
      );
      const onColOnly = positions.some(
        (i) => i % 9 === c && Math.floor(i / 9) !== r,
      );
      if (onRowOnly && onColOnly) return { row: r, col: c };
    }
  }
  return null;
}

function candidatesInCol(
  state: GridState,
  col: number,
  digit: number,
): number[] {
  const hits: number[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const idx = r * 9 + col;
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
  }
  return hits;
}

function candidatesInRow(
  state: GridState,
  row: number,
  digit: number,
): number[] {
  const hits: number[] = [];
  for (let c = 0; c < BOARD_SIZE; c++) {
    const idx = row * 9 + c;
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
  }
  return hits;
}
