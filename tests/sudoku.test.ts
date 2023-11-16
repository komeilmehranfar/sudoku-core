import { generate, analyze, solve, solveStep } from "../src/index"; // Import the createSudokuInstance module (update path as needed)

describe("sudoku-core", () => {
  describe("generate method", () => {
    it("should generate a valid easy difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("easy");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("easy");
    });
    it("should generate a valid medium difficulty board", () => {
      //Arrange
      const sudokuBoard = generate("medium");

      //Act
      const data = analyze(sudokuBoard);

      // Assert
      expect(data.difficulty).toBe("medium");
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
  describe("isBoardValid method", () => {
    it("should validate the board", () => {
      //Arrange
      const sudokuBoard = generate("expert");

      //Act
      const { isValid } = analyze(sudokuBoard);

      // Assert
      expect(isValid).toBe(true);
    });
    it("should invalidate the random generated board", () => {
      //Arrange
      const invalidSudokuBoard = [1, null, 1];

      //Act
      const { isValid } = analyze(invalidSudokuBoard);

      // Assert
      expect(isValid).toBe(false);
    });
  });
});
