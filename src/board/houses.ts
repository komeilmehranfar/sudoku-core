import { BOARD_SIZE, BOX_SIZE, CELL_COUNT } from "./constants";

/** Each house is 9 cell indices. group[0]=rows, [1]=cols, [2]=boxes */
export type House = readonly number[];
export type HouseGroups = readonly [House[], House[], House[]];

function buildHouses(): HouseGroups {
  const rows: number[][] = [];
  const cols: number[][] = [];
  const boxes: number[][] = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    const row: number[] = [];
    const col: number[] = [];
    const box: number[] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      row.push(BOARD_SIZE * i + j);
      col.push(BOARD_SIZE * j + i);
    }
    const boxRow = Math.floor(i / BOX_SIZE) * BOX_SIZE;
    const boxCol = (i % BOX_SIZE) * BOX_SIZE;
    for (let r = 0; r < BOX_SIZE; r++) {
      for (let c = 0; c < BOX_SIZE; c++) {
        box.push((boxRow + r) * BOARD_SIZE + (boxCol + c));
      }
    }
    rows.push(row);
    cols.push(col);
    boxes.push(box);
  }

  return [rows, cols, boxes];
}

export const HOUSES: HouseGroups = buildHouses();

/** For each cell: [rowIndex, colIndex, boxIndex] into HOUSES[*] */
export const CELL_HOUSES: ReadonlyArray<readonly [number, number, number]> =
  Array.from({ length: CELL_COUNT }, (_, index) => {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const box =
      Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
    return [row, col, box] as const;
  });

export function peersOf(cellIndex: number): number[] {
  const [row, col, box] = CELL_HOUSES[cellIndex];
  const set = new Set<number>([
    ...HOUSES[0][row],
    ...HOUSES[1][col],
    ...HOUSES[2][box],
  ]);
  set.delete(cellIndex);
  return [...set];
}

/** True if two distinct cells share a row, column, or box. */
export function sameHouse(a: number, b: number): boolean {
  if (a === b) return true;
  const [ra, ca, ba] = CELL_HOUSES[a];
  const [rb, cb, bb] = CELL_HOUSES[b];
  return ra === rb || ca === cb || ba === bb;
}
