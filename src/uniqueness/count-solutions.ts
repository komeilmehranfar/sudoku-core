import { CELL_COUNT } from "../board/constants";
import type { Board } from "../types";

function isValid(board: number[], index: number, num: number): boolean {
  const row = Math.floor(index / 9);
  const col = index % 9;

  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === num || board[col + 9 * i] === num) return false;
  }

  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[(startRow + i) * 9 + startCol + j] === num) return false;
    }
  }
  return true;
}

/**
 * Count solutions up to `limit` (typically 2 for uniqueness).
 * Uses a local counter — safe for concurrent / nested calls.
 */
export function countSolutions(board: Board, limit = 2): number {
  if (board.length !== CELL_COUNT) return 0;

  const grid = board.map((v) => v ?? 0);
  let count = 0;

  function solve(): boolean {
    if (count >= limit) return true;

    let bestIndex = -1;
    let bestOptions: number[] = [];

    for (let i = 0; i < CELL_COUNT; i++) {
      if (grid[i] !== 0) continue;
      const options: number[] = [];
      for (let num = 1; num <= 9; num++) {
        if (isValid(grid, i, num)) options.push(num);
      }
      if (options.length === 0) return false;
      if (bestIndex === -1 || options.length < bestOptions.length) {
        bestIndex = i;
        bestOptions = options;
        if (options.length === 1) break;
      }
    }

    if (bestIndex === -1) {
      count++;
      return count >= limit;
    }

    for (const num of bestOptions) {
      grid[bestIndex] = num;
      if (solve()) {
        if (count >= limit) {
          grid[bestIndex] = 0;
          return true;
        }
      }
      grid[bestIndex] = 0;
    }
    return false;
  }

  solve();
  return count;
}

export function isUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1;
}

export function hasAnySolution(board: Board): boolean {
  return countSolutions(board, 1) >= 1;
}

/**
 * Return the unique filled grid (1-9), or null if not exactly one solution.
 */
export function getUniqueSolution(board: Board): number[] | null {
  if (board.length !== CELL_COUNT) return null;

  const grid = board.map((v) => v ?? 0);
  let found: number[] | null = null;
  let count = 0;

  function solve(): boolean {
    if (count >= 2) return true;

    let bestIndex = -1;
    let bestOptions: number[] = [];

    for (let i = 0; i < CELL_COUNT; i++) {
      if (grid[i] !== 0) continue;
      const options: number[] = [];
      for (let num = 1; num <= 9; num++) {
        if (isValid(grid, i, num)) options.push(num);
      }
      if (options.length === 0) return false;
      if (bestIndex === -1 || options.length < bestOptions.length) {
        bestIndex = i;
        bestOptions = options;
        if (options.length === 1) break;
      }
    }

    if (bestIndex === -1) {
      count++;
      if (count === 1) found = grid.slice();
      return count >= 2;
    }

    for (const num of bestOptions) {
      grid[bestIndex] = num;
      if (solve()) {
        if (count >= 2) {
          grid[bestIndex] = 0;
          return true;
        }
      }
      grid[bestIndex] = 0;
    }
    return false;
  }

  solve();
  return count === 1 ? found : null;
}
