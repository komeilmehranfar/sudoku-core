import { createSudokuInstance } from "./sudoku";
import { isUniqueSolution } from "./sudoku-solver";
import {
  type AnalyzeData,
  type Board,
  type Difficulty,
  type SolvingStep,
  type SolvingResult,
} from "./types";

export { type AnalyzeData, type Board, type Difficulty, type SolvingStep };

export function analyze(Board: Board): AnalyzeData {
  const { analyzeBoard } = createSudokuInstance({
    initBoard: Board.slice(),
  });
  return { ...analyzeBoard(), hasUniqueSolution: isUniqueSolution(Board) };
}

export function generate(difficulty: Difficulty): Board {
  const { getBoard } = createSudokuInstance({ difficulty });
  if (!analyze(getBoard()).hasUniqueSolution) {
    return generate(difficulty);
  }
  return getBoard();
}

export function solve(Board: Board): SolvingResult {
  const solvingSteps: SolvingStep[] = [];

  const { solveAll } = createSudokuInstance({
    initBoard: Board.slice(),
    onUpdate: (solvingStep) => solvingSteps.push(solvingStep),
  });

  const analysis = analyze(Board);

  if (!analysis.hasSolution) {
    return { solved: false, error: "No solution for provided board!" };
  }

  const board = solveAll();

  if (!analysis.hasUniqueSolution) {
    return {
      solved: true,
      board,
      steps: solvingSteps,
      analysis,
      error: "No unique solution for provided board!",
    };
  }

  return { solved: true, board, steps: solvingSteps, analysis };
}

export function hint(Board: Board): SolvingResult {
  const solvingSteps: SolvingStep[] = [];
  const { solveStep } = createSudokuInstance({
    initBoard: Board.slice(),
    onUpdate: (solvingStep) => solvingSteps.push(solvingStep),
  });
  const analysis = analyze(Board);

  if (!analysis.hasSolution) {
    return { solved: false, error: "No solution for provided board!" };
  }
  const board = solveStep();

  if (!board) {
    return { solved: false, error: "No solution for provided board!" };
  }

  if (!analysis.hasUniqueSolution) {
    return {
      solved: true,
      board,
      steps: solvingSteps,
      analysis,
      error: "No unique solution for provided board!",
    };
  }

  return { solved: true, board, steps: solvingSteps, analysis };
}
