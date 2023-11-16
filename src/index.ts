import { createSudokuInstance } from "./sudoku";
import { AnalyzeData, Board, Difficulty } from "./types";

export function generate(difficulty: Difficulty): Board {
  const { getBoard } = createSudokuInstance({ difficulty });
  return getBoard();
}

export function analyze(Board: Board): AnalyzeData {
  const { analyzeBoard } = createSudokuInstance({ initBoard: Board });
  return analyzeBoard();
}

export function solve(Board: Board): Board {
  const { solveAll } = createSudokuInstance({ initBoard: Board });
  return solveAll();
}

export function solveStep(Board: Board): Board {
  const { solveStep } = createSudokuInstance({ initBoard: Board });
  return solveStep();
}
