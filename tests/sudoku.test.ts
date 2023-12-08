import { generate, analyze, solve, hasUniqueSolution } from "../src/index"; // Import the createSudokuInstance module (update path as needed)
import {
  EASY_SUDOKU_BOARD_FOR_TEST,
  EXPERT_SUDOKU_BOARD_FOR_TEST,
  HARD_SUDOKU_BOARD_FOR_TEST,
  MASTER_SUDOKU_BOARD_FOR_TEST,
  MEDIUM_SUDOKU_BOARD_FOR_TEST,
} from "./constants";

describe("sudoku-core", () => {
  describe("generate method", () => {
    it("should generate a valid easy difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("easy");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("easy");
      expect(sudokuBoard.filter(Boolean).length).toBe(40);
      expect(hasUniqueSolution(sudokuBoard)).toBe(true);
    });
    it("should generate a valid medium difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("medium");

      //Act
      const data = analyze(sudokuBoard);
      // Assert
      expect(data.difficulty).toBe("medium");
      expect(sudokuBoard.filter(Boolean).length).toBe(30);
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
    it("should solve the board", () => {
      //Arrange
      const sudokuBoard = generate("master");
      const unfilledCellsLength = sudokuBoard.filter(
        (cell) => !Boolean(cell),
      ).length;

      //Act
      const result = solve(sudokuBoard);
      const steps = result?.steps;

      // Assert
      const stepsFillingCount =
        steps?.reduce(
          (acc, curr) =>
            curr.type === "value" ? curr.updates.length + acc : acc,
          0,
        ) || 0;
      expect(stepsFillingCount).toBe(unfilledCellsLength);
    });
  });
  describe("analyze method", () => {
    it("should invalidate the wrong board", () => {
      //Arrange
      const sudokuBoard = [1];

      //Act
      const { difficulty, isValid } = analyze(sudokuBoard);

      // Assert
      expect(difficulty).toBe(undefined);
      expect(isValid).toBe(false);
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
