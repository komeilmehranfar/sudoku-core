import { createSudokuInstance } from "./sudoku";
import { AnalyzeData, Board, Difficulty, SolvingStep } from "./types";

export { type AnalyzeData, type Board, type Difficulty, type SolvingStep };

export function analyze(Board: Board): AnalyzeData {
  const { analyzeBoard } = createSudokuInstance({
    initBoard: Board,
  });
  const analysis = analyzeBoard();
  const isUnique = hasUniqueSolution(Board);
  analysis.isValid = analysis.isValid && isUnique;
  return analysis;
}

export function generate(difficulty: Difficulty): Board {
  const { getBoard } = createSudokuInstance({ difficulty });
  const board = getBoard();
  if (analyze(board).isValid) {
    return board;
  }
  return generate(difficulty);
}

export function solve(Board: Board):
  | {
      board: Board;
      steps: SolvingStep[];
    }
  | undefined {
  if (analyze(Board).isValid) {
    const solvingSteps: SolvingStep[] = [];
    const { solveAll } = createSudokuInstance({
      initBoard: Board,
      onUpdate: (solvingStep) => solvingSteps.push(solvingStep),
    });
    const board = solveAll();
    return { board, steps: solvingSteps };
  }
}

export function hint(Board: Board): SolvingStep[] | undefined {
  const solvingSteps: SolvingStep[] = [];
  const { solveStep } = createSudokuInstance({
    initBoard: Board,
    onUpdate: (solvingStep) => solvingSteps.push(solvingStep),
  });
  const board = solveStep();
  if (board) {
    return solvingSteps;
  }
}

export function hasUniqueSolution(Board: Board): boolean {
  let slicedBoard = [...Board];
  const { solveAll } = createSudokuInstance({
    initBoard: Board,
  });
  const solvedBoard = solveAll();
  if (!solvedBoard) {
    return false;
  }
  while (slicedBoard.some((item) => !Boolean(item))) {
    const { solveStep } = createSudokuInstance({
      initBoard: slicedBoard,
    });
    const board = solveStep();
    if (!board) {
      return false;
    }
    slicedBoard = board;
  }
  return solvedBoard.every((item, index) => slicedBoard[index] === item);
}
