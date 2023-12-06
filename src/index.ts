import { createSudokuInstance } from "./sudoku";
import { AnalyzeData, Board, Difficulty, SolvingStep } from "./types";

export { type AnalyzeData, type Board, type Difficulty, type SolvingStep };

export function generate(difficulty: Difficulty): Board {
  const { getBoard } = createSudokuInstance({ difficulty });
  return getBoard();
}

export function analyze(Board: Board): AnalyzeData {
  const { analyzeBoard } = createSudokuInstance({ initBoard: Board });
  return analyzeBoard();
}

export function solve(Board: Board): {
  board: Board;
  steps: SolvingStep[];
} {
  const solvingSteps: SolvingStep[] = [];
  const { solveAll } = createSudokuInstance({
    initBoard: Board,
    onUpdate: (solvingStep) => solvingSteps.push(solvingStep),
  });
  const board = solveAll();
  return { board, steps: solvingSteps };
}
