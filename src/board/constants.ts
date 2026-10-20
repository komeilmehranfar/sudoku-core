export const BOARD_SIZE = 9;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const BOX_SIZE = 3;
export const FULL_CANDIDATES = 0b1_1111_1111; // digits 1-9

/** Public difficulty bands L1 (easiest) … L10 (hardest). */
export const DIFFICULTY_L1 = "L1";
export const DIFFICULTY_L2 = "L2";
export const DIFFICULTY_L3 = "L3";
export const DIFFICULTY_L4 = "L4";
export const DIFFICULTY_L5 = "L5";
export const DIFFICULTY_L6 = "L6";
export const DIFFICULTY_L7 = "L7";
export const DIFFICULTY_L8 = "L8";
export const DIFFICULTY_L9 = "L9";
export const DIFFICULTY_L10 = "L10";

export const DIFFICULTIES = [
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
] as const;

/** What a solving step does to the grid. */
export const STEP_TYPE = {
  VALUE: "value",
  ELIMINATION: "elimination",
  ADD: "add",
} as const;

export type StepType = (typeof STEP_TYPE)[keyof typeof STEP_TYPE];

/** Machine-readable reasons on `SolvingResult.errorCode`. */
export const SOLVE_ERROR = {
  INVALID_BOARD: "INVALID_BOARD",
  NO_SOLUTION: "NO_SOLUTION",
  NEEDS_GUESSING: "NEEDS_GUESSING",
  MULTIPLE_SOLUTIONS: "MULTIPLE_SOLUTIONS",
} as const;

/**
 * Machine-readable reason attached to a `SolvingResult`:
 *
 * - `INVALID_BOARD` — not 81 cells, a value outside 1–9, or two equal digits in one house.
 * - `NO_SOLUTION` — the givens are consistent but no solution exists.
 * - `NEEDS_GUESSING` — a solution exists but the human-logic techniques get stuck.
 * - `MULTIPLE_SOLUTIONS` — solved, but the puzzle has more than one solution.
 */
export type SolveErrorCode = (typeof SOLVE_ERROR)[keyof typeof SOLVE_ERROR];
