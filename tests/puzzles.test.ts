import { analyze, solve, isUniqueSolution } from "../src/index";
import { walkthrough } from "../src/tactics/apply";
import { boardFromPublic } from "../src/board/board";
import { yWingTactic } from "../src/tactics/y-wing";
import {
  findAfterBasics,
  solutionForBoard,
  stateFromValues,
} from "./helpers/trust";
import { REAL_WORLD_PUZZLES } from "./fixtures/real-world";
import { loadProjectEuler96, parsePuzzleString } from "./fixtures/parse";
import { REGISTRY_BOARDS } from "./fixtures/registry-boards";

describe("published puzzles", () => {
  describe("curated catalog", () => {
    it.each(REAL_WORLD_PUZZLES.map((p) => [p.id, p] as const))(
      "%s is unique and matches expectations",
      (_id, puzzle) => {
        const board = parsePuzzleString(puzzle.puzzle);
        expect(board).toHaveLength(81);
        expect(isUniqueSolution(board)).toBe(true);

        const pathResult = walkthrough(boardFromPublic(board));
        const strategies = pathResult.steps.map((s) => s.strategy);

        if (puzzle.expectTechnique) {
          expect(strategies).toContain(puzzle.expectTechnique);
        }

        if (puzzle.humanSolvable) {
          expect(pathResult.solved).toBe(true);
          const result = solve(board);
          expect(result.solved).toBe(true);
          expect(result.board?.every((c) => c != null)).toBe(true);
          const data = analyze(board);
          expect(data.hasSolution).toBe(true);
          expect(data.hasUniqueSolution).toBe(true);
          expect(data.difficulty).toBeDefined();
        }
      },
    );
  });

  describe("Project Euler 96", () => {
    const pe96 = loadProjectEuler96();

    it("loads all 50 grids", () => {
      expect(pe96).toHaveLength(50);
    });

    it.each(pe96.map((p) => [p.id, p.board] as const))(
      "%s has a unique solution and is human-solvable",
      (_id, board) => {
        expect(isUniqueSolution(board)).toBe(true);
        const result = solve(board);
        expect(result.solved).toBe(true);
        expect(result.board?.filter((c) => c != null)).toHaveLength(81);
      },
    );
  });

  describe("technique smoke checks", () => {
    it("uses X-Wing on PE96 grid 07", () => {
      const puzzle = REAL_WORLD_PUZZLES.find((p) => p.id === "pe96-grid-07")!;
      const board = parsePuzzleString(puzzle.puzzle);
      const { steps } = walkthrough(boardFromPublic(board));
      expect(steps.some((s) => s.strategy === "X-Wing Strategy")).toBe(true);
    });

    it("can apply Y-Wing on its registry fixture", () => {
      const fixture = REGISTRY_BOARDS.find((f) => f.tacticId === "y-wing")!;
      const board = parsePuzzleString(fixture.puzzle);
      expect(solutionForBoard(board)).not.toBeNull();
      const state = stateFromValues(
        board.map((v) => (v == null ? 0 : v)) as number[],
      )!;
      const { step } = findAfterBasics(state, yWingTactic);
      expect(step?.strategy).toBe("Y-Wing Strategy");
    });

    it("uses Naked Pair on the SudokuWiki naked-pair example", () => {
      const puzzle = REAL_WORLD_PUZZLES.find(
        (p) => p.id === "sudokuwiki-naked-pair-example",
      )!;
      const board = parsePuzzleString(puzzle.puzzle);
      const { steps } = walkthrough(boardFromPublic(board));
      expect(steps.some((s) => s.strategy === "Naked Pair Strategy")).toBe(
        true,
      );
    });
  });
});
