import {
  boardFromPublic,
  boardToPublic,
  cloneGrid,
  isComplete,
  type GridState,
} from "./board/board";
import { SOLVE_ERROR, STEP_TYPE } from "./board/constants";
import { generatePuzzle } from "./generate/generate";
import type { GenerateOptions } from "./generate/generate";
import { rateSteps } from "./rate/difficulty";
import {
  applyStep,
  walkthrough,
  type WalkthroughResult,
} from "./tactics/apply";
import { hasAnySolution, isUniqueSolution } from "./uniqueness/count-solutions";
import type {
  AnalyzeData,
  Board,
  Difficulty,
  SolveErrorCode,
  SolvingResult,
  SolvingStep,
  Update,
} from "./types";

export type {
  AnalyzeData,
  Board,
  Difficulty,
  SolveErrorCode,
  SolvingStep,
  SolvingResult,
  Update,
};

export type { GenerateOptions };
export type { StepType } from "./board/constants";
export type { TeachingHint, HouseKind, TeachMode } from "./hint/teach";

export { DIFFICULTIES, SOLVE_ERROR, STEP_TYPE } from "./board/constants";
export { STRATEGY, TACTIC_ID } from "./tactics/names";
export type { Strategy, TacticId } from "./tactics/names";

export { isUniqueSolution } from "./uniqueness/count-solutions";

const SOLVE_ERROR_MESSAGE: Record<SolveErrorCode, string> = {
  [SOLVE_ERROR.INVALID_BOARD]: "Invalid board!",
  [SOLVE_ERROR.NO_SOLUTION]: "No solution for provided board!",
  [SOLVE_ERROR.NEEDS_GUESSING]: "No human-logic solution for provided board!",
  [SOLVE_ERROR.MULTIPLE_SOLUTIONS]: "No unique solution for provided board!",
};

/** Max solver steps a single hint may take while looking for a placement. */
const HINT_MAX_STEPS = 40;

function failure(
  errorCode: SolveErrorCode,
  analysis?: AnalyzeData,
  error = SOLVE_ERROR_MESSAGE[errorCode],
): SolvingResult {
  return analysis
    ? { solved: false, analysis, error, errorCode }
    : { solved: false, error, errorCode };
}

interface Evaluation {
  analysis: AnalyzeData;
  /** Absent when the input is not a valid grid. */
  state?: GridState;
  /** Absent when the input is invalid or the solver threw. */
  path?: WalkthroughResult;
  /** Why the input is not a valid grid; set exactly when `state` is absent. */
  invalidReason?: string;
}

/** Parse, check uniqueness, and run the human-logic solver once. */
function evaluate(board: Board): Evaluation {
  let state: GridState;
  try {
    state = boardFromPublic(board);
  } catch (err) {
    return {
      analysis: { hasSolution: false, hasUniqueSolution: false },
      invalidReason: `Invalid board: ${(err as Error).message}`,
    };
  }

  try {
    const unique = isUniqueSolution(board);
    const path = walkthrough(state);

    if (!path.solved) {
      return {
        analysis: {
          hasSolution: hasAnySolution(board),
          hasUniqueSolution: unique,
        },
        state,
        path,
      };
    }

    const rating = rateSteps(path.steps);
    return {
      analysis: {
        hasSolution: true,
        hasUniqueSolution: unique,
        usedStrategies: rating.usedStrategies,
        difficulty: rating.difficulty,
        score: rating.score,
        hardestTechnique: rating.hardestTechnique,
        hardestRank: rating.hardestRank,
        tedium: rating.tedium,
      },
      state,
      path,
    };
  } catch {
    return {
      analysis: { hasSolution: false, hasUniqueSolution: false },
      state,
    };
  }
}

/**
 * Why the human-logic solver stalled: a puzzle with several solutions can
 * never be finished by logic alone, so report that before blaming technique.
 */
function stuckErrorCode(analysis: AnalyzeData): SolveErrorCode {
  return analysis.hasUniqueSolution
    ? SOLVE_ERROR.NEEDS_GUESSING
    : SOLVE_ERROR.MULTIPLE_SOLUTIONS;
}

/**
 * Steps up to and including the first placement (at most {@link HINT_MAX_STEPS}),
 * or null when the solver gets stuck before placing anything.
 */
function hintPrefix(steps: SolvingStep[]): SolvingStep[] | null {
  const prefix: SolvingStep[] = [];
  for (const step of steps.slice(0, HINT_MAX_STEPS)) {
    prefix.push(step);
    if (step.type === STEP_TYPE.VALUE) return prefix;
  }
  return prefix.length === HINT_MAX_STEPS ? prefix : null;
}

/**
 * Rate a board's difficulty and check whether it has a (unique) solution.
 *
 * @example
 * ```ts
 * const { difficulty, hardestTechnique } = analyze(board);
 * ```
 */
export function analyze(board: Board): AnalyzeData {
  return evaluate(board).analysis;
}

/**
 * Generate a puzzle with exactly one solution that can be solved with
 * human-logic techniques and rates at the requested difficulty.
 *
 * @param difficulty - `"L1"` (easiest) … `"L10"` (hardest).
 * @param options - `seed` makes the result deterministic (e.g. a daily puzzle);
 *   `maxAttempts` (default 500) bounds the search, and `timeoutMs` adds a
 *   wall-clock limit (default 16000 ms, or none when a seed is given).
 *
 * @example
 * ```ts
 * const board = generate("L4");
 * const daily = generate("L3", { seed: 20261020 });
 * ```
 */
export function generate(
  difficulty: Difficulty,
  options?: GenerateOptions,
): Board {
  return generatePuzzle({ difficulty, ...options });
}

/**
 * Solve the whole board with human-logic techniques (no guessing) and return
 * every step taken, plus the difficulty analysis.
 *
 * Check `errorCode` when `solved` is false, or when a solved board has more
 * than one solution (`MULTIPLE_SOLUTIONS`).
 *
 * @example
 * ```ts
 * const result = solve(board);
 * if (result.solved) console.log(result.board, result.steps.length);
 * else console.log(result.errorCode);
 * ```
 */
export function solve(board: Board): SolvingResult {
  const { analysis, state, path, invalidReason } = evaluate(board);
  if (!state) {
    return failure(SOLVE_ERROR.INVALID_BOARD, undefined, invalidReason);
  }
  if (!analysis.hasSolution || !path) return failure(SOLVE_ERROR.NO_SOLUTION);
  if (!path.solved) return failure(stuckErrorCode(analysis), analysis);

  const result: SolvingResult = {
    solved: true,
    board: boardToPublic(path.state),
    steps: path.steps,
    analysis,
  };

  if (!analysis.hasUniqueSolution) {
    result.error = SOLVE_ERROR_MESSAGE[SOLVE_ERROR.MULTIPLE_SOLUTIONS];
    result.errorCode = SOLVE_ERROR.MULTIPLE_SOLUTIONS;
  }

  return result;
}

export { teachHint, applyTeachStep, candidatesFromBoard } from "./hint/teach";

/**
 * Advance the board to its next placement. `steps` holds the eliminations
 * that led to it, followed by the placement itself.
 *
 * For a richer, UI-ready explanation (highlight cells, pencil-mark
 * reconciliation) use {@link teachHint}.
 *
 * @example
 * ```ts
 * const { board: next, steps } = hint(board);
 * console.log(steps[steps.length - 1].strategy); // "Single Candidate Strategy"
 * ```
 */
export function hint(board: Board): SolvingResult {
  const { analysis, state, path, invalidReason } = evaluate(board);
  if (!state) {
    return failure(SOLVE_ERROR.INVALID_BOARD, undefined, invalidReason);
  }
  if (!analysis.hasSolution || !path) return failure(SOLVE_ERROR.NO_SOLUTION);

  if (isComplete(state)) {
    return { solved: true, board: boardToPublic(state), steps: [], analysis };
  }

  const steps = hintPrefix(path.steps);
  if (!steps) return failure(stuckErrorCode(analysis), analysis);

  const next = cloneGrid(state);
  for (const step of steps) applyStep(next, step);

  const payload: SolvingResult = {
    solved: true,
    board: boardToPublic(next),
    steps,
    analysis,
  };

  if (!analysis.hasUniqueSolution) {
    payload.error = SOLVE_ERROR_MESSAGE[SOLVE_ERROR.MULTIPLE_SOLUTIONS];
    payload.errorCode = SOLVE_ERROR.MULTIPLE_SOLUTIONS;
  }

  return payload;
}

export { CELL_COUNT } from "./board/constants";
export {
  getUniqueSolution,
  hasAnySolution,
} from "./uniqueness/count-solutions";
export { HOUSE_KIND, TEACH_MODE, TEACH_STRATEGY } from "./hint/teach";
export { TACTICS } from "./tactics/registry";
export type { Tactic, TacticFn } from "./tactics/types";
export type { GridState } from "./board/board";
export {
  LEARN_TARGETS,
  generateExamplesForTactic,
  type GenerateLessonExamplesOptions,
  type LearnExample,
  type LearnLessonTarget,
} from "./learn/generate-examples";
