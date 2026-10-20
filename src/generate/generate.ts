import {
  boardToPublic,
  clearValue,
  cloneGrid,
  createEmptyGrid,
  placeValue,
  type GridState,
} from "../board/board";
import { CELL_COUNT, DIFFICULTIES } from "../board/constants";
import { digitsFromMask } from "../board/candidates";
import { walkthrough } from "../tactics/apply";
import { isAtLeast, isAtMost, rateSteps } from "../rate/difficulty";
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
function clueTarget(difficulty: Difficulty): number {
  const targets: Record<Difficulty, number> = {
    L1: 42,
    L2: 38,
    L3: 34,
    L4: 30,
    L5: 28,
    L6: 26,
    L7: 24,
    L8: 22,
    L9: 21,
    L10: 20,
  };
  return targets[difficulty];
}

/**
 * Only L1 may soft-accept an easier puzzle (open-singles floor).
 * L2+ must not slip softer than asked.
 */
function acceptsEasier(difficulty: Difficulty): boolean {
  return difficulty === "L1";
}

function difficultyIndexLocal(d: Difficulty): number {
  return DIFFICULTIES.indexOf(d);
}

/** Dig may briefly overshoot by one band; final accept prefers exact. */
function maxAllowed(difficulty: Difficulty): Difficulty {
  const idx = difficultyIndexLocal(difficulty);
  return DIFFICULTIES[Math.min(idx + 1, DIFFICULTIES.length - 1)]!;
}

export interface GenerateOptions {
  difficulty: Difficulty;
  /** Wall-clock budget in ms */
  timeoutMs?: number;
  maxAttempts?: number;
  /** Optional seed for deterministic puzzles (e.g. daily challenge). */
  seed?: number;
}

/**
 * Generate a unique, human-solvable puzzle matching the L1–L10 difficulty band.
 */
export function generatePuzzle(options: GenerateOptions): Board {
  const { difficulty, timeoutMs = 16_000, maxAttempts = 80, seed } = options;
  const random =
    seed === undefined ? Math.random : mulberry32(seed >>> 0);
  const started = Date.now();
  /** Exact band snapshot captured mid-dig (before further removals soften it). */
  let exactFallback: Board | null = null;
  /** Softer than asked — only used when acceptsEasier (L1). */
  let softerFallback: Board | null = null;
  /** Harder than asked — last resort so we never under-shoot L2+. */
  let harderFallback: Board | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (Date.now() - started > timeoutMs) break;

    const filled = fillCompleteGrid(random);
    const order = shuffle([...Array(CELL_COUNT).keys()], random);
    const targetClues = clueTarget(difficulty);
    let removals = CELL_COUNT - targetClues;

    for (const cellIndex of order) {
      if (removals <= 0) break;
      if (Date.now() - started > timeoutMs) break;

      const digit = filled.values[cellIndex];
      if (digit === 0) continue;

      clearValue(filled, cellIndex);
      const board = boardToPublic(filled);

      if (!isUniqueSolution(board)) {
        placeValue(filled, cellIndex, digit);
        continue;
      }

      const path = walkthrough(filled);
      if (!path.solved) {
        placeValue(filled, cellIndex, digit);
        continue;
      }

      const rating = rateSteps(path.steps);
      if (!isAtMost(rating.difficulty, maxAllowed(difficulty))) {
        placeValue(filled, cellIndex, digit);
        continue;
      }

      removals--;
      if (
        isAtLeast(rating.difficulty, difficulty) &&
        isAtMost(rating.difficulty, difficulty)
      ) {
        exactFallback = board;
      } else if (
        isAtLeast(rating.difficulty, difficulty) &&
        isAtMost(rating.difficulty, maxAllowed(difficulty))
      ) {
        harderFallback = board;
      } else if (acceptsEasier(difficulty)) {
        softerFallback = board;
      }
    }

    const puzzle = boardToPublic(filled);
    const path = walkthrough(filled);
    if (!path.solved || !isUniqueSolution(puzzle)) continue;

    const rating = rateSteps(path.steps);
    if (
      isAtLeast(rating.difficulty, difficulty) &&
      isAtMost(rating.difficulty, difficulty)
    ) {
      return puzzle;
    }

    if (
      isAtLeast(rating.difficulty, difficulty) &&
      isAtMost(rating.difficulty, maxAllowed(difficulty))
    ) {
      harderFallback = puzzle;
      continue;
    }

    if (acceptsEasier(difficulty) && isAtMost(rating.difficulty, difficulty)) {
      return puzzle;
    }

    if (acceptsEasier(difficulty)) {
      softerFallback = puzzle;
    }
  }

  if (exactFallback) return exactFallback;
  if (harderFallback) return harderFallback;
  if (softerFallback) return softerFallback;
  throw new Error(
    `Could not generate a "${difficulty}" puzzle within budget (${timeoutMs}ms / ${maxAttempts} attempts)`,
  );
}
