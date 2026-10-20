import {
  generate,
  analyze,
  solve,
  hint,
  Difficulty,
  Board,
  isUniqueSolution,
  SOLVE_ERROR,
  STEP_TYPE,
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

  describe("errorCode", () => {
    const fromString = (p: string): Board =>
      [...p].map((c) => (c === "0" ? null : Number(c)));
    // Arto Inkala's "Everest": stuck before the first placement.
    const everest = fromString(
      "800000000003600000070090200050007000000045700000100030001000068008500010090000400",
    );
    // "Platinum Blonde": a few placements, then stuck.
    const platinumBlonde = fromString(
      "000000012000000003002300400001800005060070800000009000008500000900040500470006000",
    );
    const duplicate: Board = Array(81).fill(null);
    duplicate[0] = 5;
    duplicate[1] = 5;
    // Row 1 holds 1–8 and column 9 already has a 9, so r1c9 has no candidate.
    const unsolvable: Board = Array(81).fill(null);
    for (let i = 0; i < 8; i++) unsolvable[i] = i + 1;
    unsolvable[17] = 9;

    it.each([
      ["wrong length", [1] as Board],
      ["duplicate digit in a house", duplicate],
    ])("INVALID_BOARD for %s", (_label, board) => {
      expect(solve(board).errorCode).toBe(SOLVE_ERROR.INVALID_BOARD);
      expect(hint(board).errorCode).toBe(SOLVE_ERROR.INVALID_BOARD);
    });

    it("NO_SOLUTION for consistent givens with no solution", () => {
      expect(solve(unsolvable).errorCode).toBe(SOLVE_ERROR.NO_SOLUTION);
      expect(hint(unsolvable).errorCode).toBe(SOLVE_ERROR.NO_SOLUTION);
    });

    it("NEEDS_GUESSING when human logic gets stuck", () => {
      const result = solve(everest);
      expect(result.solved).toBe(false);
      expect(result.errorCode).toBe(SOLVE_ERROR.NEEDS_GUESSING);
      expect(result.analysis?.hasUniqueSolution).toBe(true);
      expect(hint(everest).errorCode).toBe(SOLVE_ERROR.NEEDS_GUESSING);
    });

    it("hint still places a digit when the solver only gets stuck later", () => {
      expect(solve(platinumBlonde).errorCode).toBe(SOLVE_ERROR.NEEDS_GUESSING);
      const result = hint(platinumBlonde);
      expect(result.solved).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(result.steps?.[result.steps.length - 1]?.type).toBe(STEP_TYPE.VALUE);
    });

    it("has no errorCode on a unique, solvable board", () => {
      expect(solve([...L4_BOARD]).errorCode).toBeUndefined();
    });
  });

  describe("generate", () => {
    // Seeded so CI is deterministic. Seed 1 / L4 and seed 5 / L6 used to throw.
    it.each(
      DIFFICULTIES.flatMap((difficulty) =>
        [1, 5].map((seed) => [difficulty, seed] as [Difficulty, number]),
      ),
    )(
      "generates a unique puzzle rated exactly %s (seed %i)",
      (difficulty, seed) => {
        const board = generate(difficulty, { seed });
        expect(board).toHaveLength(81);
        expect(isUniqueSolution(board)).toBe(true);
        const data = analyze(board);
        expect(data.hasSolution).toBe(true);
        expect(data.difficulty).toBe(difficulty);
      },
      // seed 5 / L6 is the slowest case (~9 s under ts-jest locally, slower on CI)
      120_000,
    );
  });
});
