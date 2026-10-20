import {
  boardToPublic,
  clearValue,
  cloneGrid,
  createEmptyGrid,
  placeValue,
  type GridState,
} from "../board/board";
import {
  CELL_COUNT,
  DIFFICULTY_L1,
  DIFFICULTY_L2,
  DIFFICULTY_L3,
  DIFFICULTY_L4,
  DIFFICULTY_L5,
  DIFFICULTY_L6,
  DIFFICULTY_L7,
  DIFFICULTY_L8,
  DIFFICULTY_L9,
  DIFFICULTY_L10,
} from "../board/constants";
import { digitsFromMask } from "../board/candidates";
import { walkthrough } from "../tactics/apply";
import { isAtMost, rateSteps } from "../rate/difficulty";
import { isUniqueSolution } from "../uniqueness/count-solutions";
import type { Board, Difficulty } from "../types";

type RandomFn = () => number;

function mulberry32(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: RandomFn = Math.random): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fillCompleteGrid(random: RandomFn): GridState {
  const state = createEmptyGrid();

  function solve(index: number): boolean {
    if (index >= CELL_COUNT) return true;
    if (state.values[index] !== 0) return solve(index + 1);

    const digits = shuffle(digitsFromMask(state.candidates[index]), random);
    for (const digit of digits) {
      const snapshot = cloneGrid(state);
      if (!placeValue(state, index, digit)) {
        Object.assign(state, snapshot);
        continue;
      }
      if (solve(index + 1)) return true;
      state.values = snapshot.values;
      state.candidates = snapshot.candidates;
    }
    return false;
  }

  if (!solve(0)) throw new Error("Failed to fill a complete grid");
  return state;
}

/** Fewer clues as difficulty rises (soft target while digging). */
const CLUE_TARGET: Record<Difficulty, number> = {
  [DIFFICULTY_L1]: 42,
  [DIFFICULTY_L2]: 38,
  [DIFFICULTY_L3]: 34,
  [DIFFICULTY_L4]: 30,
  [DIFFICULTY_L5]: 28,
  [DIFFICULTY_L6]: 26,
  [DIFFICULTY_L7]: 24,
  [DIFFICULTY_L8]: 22,
  [DIFFICULTY_L9]: 21,
  [DIFFICULTY_L10]: 20,
};

/** Options for `generate`. */
export interface GenerateOptions {
  /** Wall-clock budget in ms (default 16000). */
  timeoutMs?: number;
  /** Fresh grids to dig before giving up (default 500; each takes ~30 ms). */
  maxAttempts?: number;
  /** Optional seed for deterministic puzzles (e.g. daily challenge). */
  seed?: number;
}

export interface GeneratePuzzleOptions extends GenerateOptions {
  difficulty: Difficulty;
}

/** Difficulty of a unique board the human-logic solver can finish, else null. */
function humanRating(grid: GridState, board: Board): Difficulty | null {
  if (!isUniqueSolution(board)) return null;
  const path = walkthrough(grid);
  return path.solved ? rateSteps(path.steps).difficulty : null;
}

/**
 * Generate a unique, human-solvable puzzle rated exactly `difficulty`.
 *
 * Digs clues out of a random full grid, undoing any removal that breaks
 * uniqueness, needs guessing, or rates harder than asked. It keeps digging
 * while the puzzle is still too easy, and stops at the clue target once the
 * band is reached.
 */
export function generatePuzzle(options: GeneratePuzzleOptions): Board {
  const { difficulty, timeoutMs = 16_000, maxAttempts = 500, seed } = options;
  const random = seed === undefined ? Math.random : mulberry32(seed >>> 0);
  const started = Date.now();
  const outOfTime = () => Date.now() - started > timeoutMs;
  const targetClues = CLUE_TARGET[difficulty];

  for (let attempt = 0; attempt < maxAttempts && !outOfTime(); attempt++) {
    const grid = fillCompleteGrid(random);
    let clues = CELL_COUNT;
    /** Sparsest board seen at exactly the requested band in this dig. */
    let exact: Board | null = null;

    for (const cellIndex of shuffle([...Array(CELL_COUNT).keys()], random)) {
      if (outOfTime()) break;

      const digit = grid.values[cellIndex];
      clearValue(grid, cellIndex);
      const board = boardToPublic(grid);
      const rating = humanRating(grid, board);

      if (rating === null || !isAtMost(rating, difficulty)) {
        placeValue(grid, cellIndex, digit);
        continue;
      }

      clues--;
      if (rating === difficulty) {
        exact = board;
        if (clues <= targetClues) return board;
      }
    }

    if (exact) return exact;
  }

  throw new Error(
    `Could not generate a "${difficulty}" puzzle within budget (${timeoutMs}ms / ${maxAttempts} attempts)`,
  );
}
