import { createSudokuInstance } from "./sudoku";
import { AnalyzeData, Board, Difficulty, SolvingStep } from "./types";

export { type AnalyzeData, type Board, type Difficulty, type SolvingStep };

export function generate(difficulty: Difficulty): Board {
  const { getBoard } = createSudokuInstance({ difficulty });
  const board = getBoard();
  if (hasUniqueSolution(board)) {
    return board;
  }
  return generate(difficulty);
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

export function hasUniqueSolution(Board: Board): boolean {
  const slicedBoard = [...Board];
  const solvingAttempts: { board: Board; steps: SolvingStep[] }[] = [];
  let index = 0;
  while (slicedBoard.some((item) => !Boolean(item))) {
    if (solvingAttempts[index - 1]) {
      const { steps } = solvingAttempts[index - 1];
      const step = steps.find((step) => {
        if (step.type === "value") {
          return true;
        }
      });
      if (!step) {
        break;
      }
      step.updates.forEach((update) => {
        slicedBoard[update.index] = update.filledValue;
      });
    }
    solvingAttempts.push(solve(slicedBoard));
    index++;
  }
  return solvingAttempts[0].board.every(
    (item, index) => slicedBoard[index] === item,
  );
}
