import {
  generate,
  analyze,
  solve,
  hint,
  Difficulty,
  Board,
  isUniqueSolution,
} from "../src/index";
import { DIFFICULTIES } from "../src/board/constants";
import {
  L1_BOARD,
  L4_BOARD,
  L5_BOARD,
  L6_BOARD,
  L8_BOARD,
} from "./fixtures/api-boards";

describe("api", () => {
  describe("analyze", () => {
    it("invalidates a wrong board", () => {
      const { difficulty, hasSolution, hasUniqueSolution } = analyze([1]);
      expect(difficulty).toBe(undefined);
      expect(hasSolution).toBe(false);
      expect(hasUniqueSolution).toBe(false);
    });

    it.each([
      ["L1", L1_BOARD],
      ["L4", L4_BOARD],
      ["L5", L5_BOARD],
      ["L6", L6_BOARD],
      ["L8", L8_BOARD],
    ] as [Difficulty, Board][])(
      "rates the %s fixture",
      (label, sudokuBoard) => {
        const data = analyze([...sudokuBoard]);
        expect(data.hasSolution).toBe(true);
        expect(data.hasUniqueSolution).toBe(true);
        expect(isUniqueSolution(sudokuBoard)).toBe(true);
        expect(data.difficulty).toBe(label);
        expect(data.score).toBeGreaterThan(0);
        expect(data.hardestTechnique).toBeDefined();
        expect(data.hardestRank).toBeGreaterThan(0);
      },
    );
  });

  describe("solve", () => {
    it.each([
      ["L1", L1_BOARD],
      ["L4", L4_BOARD],
      ["L5", L5_BOARD],
      ["L6", L6_BOARD],
      ["L8", L8_BOARD],
    ] as [Difficulty, Board][])(
      "solves the %s board",
      (_label, sudokuBoard) => {
        const emptyCellsLength = sudokuBoard.filter((cell) => !cell).length;
        const result = solve(sudokuBoard);
        expect(result.solved).toBe(true);
        expect(result.board?.every((c) => c != null)).toBe(true);

        const filledCellsLength =
          result.steps?.reduce(
            (acc, curr) =>
              curr.type === "value" ? curr.updates.length + acc : acc,
            0,
          ) || 0;
        expect(filledCellsLength).toBe(emptyCellsLength);
      },
    );
  });

  describe("hint", () => {
    it("fills exactly one value on the L1 board", () => {
      const result = hint([...L1_BOARD]);
      expect(result.solved).toBe(true);
      const filled =
        result.steps?.reduce(
          (acc, curr) =>
            curr.type === "value" ? curr.updates.length + acc : acc,
          0,
        ) || 0;
      expect(filled).toBe(1);
    });
  });

  describe("generate", () => {
    it.each(["L1", "L4", "L7"] as Difficulty[])(
      "generates a unique %s puzzle at or below the band",
      (difficulty) => {
        const board = generate(difficulty);
        expect(board).toHaveLength(81);
        expect(isUniqueSolution(board)).toBe(true);
        const data = analyze(board);
        expect(data.hasSolution).toBe(true);
        expect(DIFFICULTIES).toContain(data.difficulty);
        // Never harder than requested (exact match when dig budget allows).
        const idx = DIFFICULTIES.indexOf(data.difficulty!);
        const want = DIFFICULTIES.indexOf(difficulty);
        expect(idx).toBeLessThanOrEqual(want);
      },
      25_000,
    );
  });
});
