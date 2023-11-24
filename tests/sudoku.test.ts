import { generate, analyze, solve, solveStep } from "../src/index"; // Import the createSudokuInstance module (update path as needed)
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
    });
    it("should generate a valid medium difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("medium");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("medium");
      expect(sudokuBoard.filter(Boolean).length).toBe(30);
    });
    it("should generate a valid hard difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("hard");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("hard");
    });
    it("should generate a valid expert difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("expert");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("expert");
    });
    it("should generate a valid master difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("master");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("master");
    });
  });

  describe("solve method", () => {
    it("should solve the board", () => {
      //Arrange
      const sudokuBoard = generate("expert");

      //Act
      const solvedBoard = solve(sudokuBoard);

      // Assert
      expect(solvedBoard.every((cell) => cell !== null)).toBe(true);
    });
  });
  describe("solveStep method", () => {
    it("should solve one more step", () => {
      //Arrange
      const sudokuBoard = generate("expert");

      for (let index = 0; index < 81; index++) {
        //Arrange
        const boardBeforeLength = sudokuBoard.filter(Boolean).length;

        //Act
        const solvedBoard = solveStep(sudokuBoard);

        // Assert
        const boardAfterLength = solvedBoard.filter(Boolean).length;
        expect(
          boardAfterLength - boardBeforeLength === 1 ||
            boardBeforeLength === 81,
        ).toBe(true);
      }
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
