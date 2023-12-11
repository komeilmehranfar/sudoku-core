import {
  DIFFICULTY_EASY,
  DIFFICULTY_EXPERT,
  DIFFICULTY_HARD,
  DIFFICULTY_MASTER,
  DIFFICULTY_MEDIUM,
} from "../src/constants";
import {
  generate,
  analyze,
  solve,
  Difficulty,
  Board,
  hint,
} from "../src/index"; // Import the createSudokuInstance module (update path as needed)
import { createSudokuInstance } from "../src/sudoku";
import {
  EASY_SUDOKU_BOARD_FOR_TEST,
  EXPERT_SUDOKU_BOARD_FOR_TEST,
  HARD_SUDOKU_BOARD_FOR_TEST,
  MASTER_SUDOKU_BOARD_FOR_TEST,
  MEDIUM_SUDOKU_BOARD_FOR_TEST,
} from "./constants";

function hasUniqueSolution(Board: Board): boolean {
  const { solveAll } = createSudokuInstance({
    initBoard: Board,
  });
  const solvedBoard = solveAll();
  if (!solvedBoard) {
    return false;
  }
  const { solveStep, getBoard } = createSudokuInstance({
    initBoard: Board,
  });
  while (getBoard().some((item) => !Boolean(item))) {
    if (!solveStep()) {
      return false;
    }
  }
  return solvedBoard.every((item, index) => getBoard()[index] === item);
}
describe("sudoku-core", () => {
  describe("generate method", () => {
    it("should generate a valid easy difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("easy");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("easy");
      expect(hasUniqueSolution(sudokuBoard)).toBe(true);
    });
    it("should generate a valid medium difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("medium");

      //Act
      const data = analyze(sudokuBoard);
      // Assert
      expect(data.difficulty).toBe("medium");
      expect(hasUniqueSolution(sudokuBoard)).toBe(true);
    });
    it("should generate a valid hard difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("hard");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("hard");
      expect(hasUniqueSolution(sudokuBoard)).toBe(true);
    });
    it("should generate a valid expert difficulty board", () => {
      //Arrange

      const sudokuBoard = generate("expert");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("expert");
      expect(hasUniqueSolution(sudokuBoard)).toBe(true);
    });
    it("should generate a valid master difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("master");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("master");
      expect(hasUniqueSolution(sudokuBoard)).toBe(true);
    });
  });

  describe("solve method", () => {
    const items = [
      [DIFFICULTY_EASY, EASY_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_MEDIUM, MEDIUM_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_HARD, HARD_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_EXPERT, EXPERT_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_MASTER, MASTER_SUDOKU_BOARD_FOR_TEST],
    ] as [Difficulty, Board][];
    items.forEach(([difficulty, sudokuBoard]) => {
      it(`should solve the ${difficulty} board`, () => {
        //Arrange
        const emptyCellsLength = sudokuBoard.filter(
          (cell) => !Boolean(cell),
        ).length;

        //Act
        const result = solve(sudokuBoard);
        const steps = result?.steps;
        const solvedBoard = result?.board;
        // Assert
        const filledCellsLength =
          steps?.reduce(
            (acc, curr) =>
              curr.type === "value" ? curr.updates.length + acc : acc,
            0,
          ) || 0;
        expect(filledCellsLength).toBe(emptyCellsLength);
        expect(solvedBoard).toMatchSnapshot();
        expect(steps).toMatchSnapshot();
      });
    });
  });
  describe("hint method", () => {
    const items = [
      [DIFFICULTY_EASY, EASY_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_MEDIUM, MEDIUM_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_HARD, HARD_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_EXPERT, EXPERT_SUDOKU_BOARD_FOR_TEST],
      [DIFFICULTY_MASTER, MASTER_SUDOKU_BOARD_FOR_TEST],
    ] as [Difficulty, Board][];
    items.forEach(([difficulty, sudokuBoard]) => {
      it(`should solve the ${difficulty} board`, () => {
        //Arrange

        //Act
        const result = hint(sudokuBoard);

        const steps = result?.steps;
        const solvedBoard = result?.board;
        // Assert
        const filledCellsLength =
          steps?.reduce(
            (acc, curr) =>
              curr.type === "value" ? curr.updates.length + acc : acc,
            0,
          ) || 0;
        expect(filledCellsLength).toBe(1);
        expect(solvedBoard).toMatchSnapshot();
        expect(steps).toMatchSnapshot();
      });
    });
  });
  describe("analyze method", () => {
    it("should invalidate the wrong board", () => {
      //Arrange
      const sudokuBoard = [1];

      //Act
      const { difficulty, hasSolution } = analyze(sudokuBoard);

      // Assert
      expect(difficulty).toBe(undefined);
      expect(hasSolution).toBe(false);
    });
    it("should validate the easy board", () => {
      //Arrange
      const sudokuBoard = [...EASY_SUDOKU_BOARD_FOR_TEST];

      //Act
      const { difficulty } = analyze(sudokuBoard);

      // Assert
      expect(difficulty).toBe("easy");
    });
    it("should validate the medium board", () => {
      //Arrange
      const sudokuBoard = [...MEDIUM_SUDOKU_BOARD_FOR_TEST];

      //Act
      const { difficulty } = analyze(sudokuBoard);

      // Assert
      expect(difficulty).toBe("medium");
    });
    it("should validate the hard board", () => {
      //Arrange
      const sudokuBoard = [...HARD_SUDOKU_BOARD_FOR_TEST];

      //Act
      const { difficulty } = analyze(sudokuBoard);

      // Assert
      expect(difficulty).toBe("hard");
    });
    it("should validate the expert board", () => {
      //Arrange
      const sudokuBoard = [...EXPERT_SUDOKU_BOARD_FOR_TEST];

      //Act
      const { difficulty } = analyze(sudokuBoard);

      // Assert
      expect(difficulty).toBe("expert");
    });
    it("should validate the master board", () => {
      //Arrange
      const sudokuBoard = [...MASTER_SUDOKU_BOARD_FOR_TEST];

      //Act
      const { difficulty } = analyze(sudokuBoard);

      // Assert
      expect(difficulty).toBe("master");
    });
  });
});
