import { boardFromPublic, boardToPublic, isComplete } from "./board/board";
import { generatePuzzle } from "./generate/generate";
import { rateSteps } from "./rate/difficulty";
import { hintStep, walkthrough } from "./tactics/apply";
import { hasAnySolution, isUniqueSolution } from "./uniqueness/count-solutions";
import type {
  AnalyzeData,
  Board,
  Difficulty,
  SolvingResult,
  SolvingStep,
  Update,
} from "./types";

export type {
  AnalyzeData,
  Board,
  Difficulty,
  SolvingStep,
  SolvingResult,
  Update,
};
export { DIFFICULTIES } from "./board/constants";

export { isUniqueSolution } from "./uniqueness/count-solutions";

function analyzeBoard(board: Board): AnalyzeData {
  try {
    const state = boardFromPublic(board);
    const unique = isUniqueSolution(board);
    const path = walkthrough(state);

    if (!path.solved) {
      return {
        hasSolution: hasAnySolution(board),
        hasUniqueSolution: unique,
      };
    }

    const rating = rateSteps(path.steps);
    return {
      hasSolution: true,
      hasUniqueSolution: unique,
      usedStrategies: rating.usedStrategies,
      difficulty: rating.difficulty,
      score: rating.score,
      hardestTechnique: rating.hardestTechnique,
      hardestRank: rating.hardestRank,
      tedium: rating.tedium,
    };
  } catch {
    return {
      hasSolution: false,
      hasUniqueSolution: false,
    };
  }
}

export function analyze(board: Board): AnalyzeData {
  return analyzeBoard(board);
}

export function generate(
  difficulty: Difficulty,
  options?: { seed?: number; timeoutMs?: number; maxAttempts?: number },
): Board {
  return generatePuzzle({ difficulty, ...options });
}

export function solve(board: Board): SolvingResult {
  try {
    const analysis = analyzeBoard(board);
    if (!analysis.hasSolution) {
      return { solved: false, error: "No solution for provided board!" };
    }

    const state = boardFromPublic(board);
    const path = walkthrough(state);

    if (!path.solved) {
      return {
        solved: false,
        analysis,
        error: "No human-logic solution for provided board!",
      };
    }

    const result: SolvingResult = {
      solved: true,
      board: boardToPublic(path.state),
      steps: path.steps,
      analysis,
    };

    if (!analysis.hasUniqueSolution) {
      result.error = "No unique solution for provided board!";
    }

    return result;
  } catch {
    return { solved: false, error: "No solution for provided board!" };
  }
}

export { teachHint, applyTeachStep, candidatesFromBoard } from "./hint/teach";
export type { TeachingHint, HouseKind } from "./hint/teach";

export function hint(board: Board): SolvingResult {
  try {
    const analysis = analyzeBoard(board);
    if (!analysis.hasSolution) {
      return { solved: false, error: "No solution for provided board!" };
    }

    const state = boardFromPublic(board);
    if (isComplete(state)) {
      return {
        solved: true,
        board: boardToPublic(state),
        steps: [],
        analysis,
      };
    }

    const result = hintStep(state);
    if (!result) {
      return {
        solved: false,
        analysis,
        error: "No solution for provided board!",
      };
    }

    const payload: SolvingResult = {
      solved: true,
      board: boardToPublic(result.board),
      steps: result.steps,
      analysis,
    };

    if (!analysis.hasUniqueSolution) {
      payload.error = "No unique solution for provided board!";
    }

    return payload;
  } catch {
    return { solved: false, error: "No solution for provided board!" };
  }
}

export { CELL_COUNT } from "./board/constants";
export { getUniqueSolution, hasAnySolution } from "./uniqueness/count-solutions";
export { TEACH_MODE } from "./hint/teach";
export { TACTICS } from "./tactics/registry";
export {
  LEARN_TARGETS,
  generateExamplesForTactic,
  type LearnExample,
  type LearnLessonTarget,
} from "./learn/generate-examples";

