import {
  DIFFICULTIES,
  type SolveErrorCode,
  type StepType,
} from "./board/constants";

/** Difficulty band, from `"L1"` (easiest) to `"L10"` (hardest). */
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * A Sudoku grid as 81 cells in row-major order (index = row * 9 + column).
 * Each cell is a digit 1–9, or `null` when empty.
 */
export type Board = Array<number | null>;

/** A single cell change produced by a solving step. */
export interface Update {
  /** Cell index 0–80 (row * 9 + column). */
  index: number;
  /** Candidate removed from the cell's pencil marks. */
  eliminatedCandidate?: number;
  /** Digit placed in the cell. */
  filledValue?: number;
  /** Pencil-mark teaching: add this candidate into the cell's notes */
  addedCandidate?: number;
}

/** One application of a named technique. */
export interface SolvingStep {
  /** Technique title, e.g. `"X-Wing Strategy"`. See `STRATEGY`. */
  strategy: string;
  updates: Update[];
  /** `value` places digits, `elimination` removes candidates, `add` restores missing notes. */
  type: StepType;
  /** Technique nodes (e.g. kite ends / conjugates) for teaching highlights */
  patternCells?: number[];
  /** Digits that define the pattern (e.g. naked/hidden pair {2,6}) */
  patternDigits?: number[];
  /** Houses to shade (row/col/box cells involved in the pattern) */
  regionCells?: number[];
}

/** Difficulty rating and solvability report for a board. */
export interface AnalyzeData {
  /** At least one solution exists (checked by backtracking). */
  hasSolution: boolean;
  /** Exactly one solution exists. */
  hasUniqueSolution?: boolean;
  /** Techniques the human-logic solver needed, easiest first, with how often each was used. */
  usedStrategies?: Array<{ title: string; freq: number }>;
  difficulty?: Difficulty;
  /** Weighted sum of technique costs; higher means more work. */
  score?: number;
  /** Title of the hardest technique required. */
  hardestTechnique?: string;
  /** Rank of the hardest technique (lower = easier). */
  hardestRank?: number;
  /** Steps per placement; higher means more grinding. */
  tedium?: number;
}

export type { SolveErrorCode };

/** Result of {@link solve} or {@link hint}. */
export interface SolvingResult {
  solved: boolean;
  board?: Board;
  steps?: SolvingStep[];
  analysis?: AnalyzeData;
  /** Human-readable message. Prefer {@link SolvingResult.errorCode} for branching. */
  error?: string;
  errorCode?: SolveErrorCode;
}
