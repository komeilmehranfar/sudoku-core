import * as fs from "fs";
import * as path from "path";
import { walkthrough } from "../../src/tactics/apply";
import { TACTICS } from "../../src/tactics/registry";
import type { Tactic } from "../../src/tactics/types";
import {
  assertEliminationsSound,
  findAfterBasics,
  solutionForBoard,
  stateFromValues,
} from "../helpers/trust";
import { CURATED_BOARDS } from "../fixtures/curated-boards";
import { REAL_WORLD_PUZZLES } from "../fixtures/real-world";
import { REGISTRY_BOARDS } from "../fixtures/registry-boards";
import { loadProjectEuler96, parsePuzzleString } from "../fixtures/parse";
import type { Board } from "../../src/types";

interface TechniqueExample {
  technique: string;
  exampleIndex: number;
  givens: string;
  clues: number;
}

const TECHNIQUE_TO_TACTIC: Record<string, string> = {
  "last-digit": "open-singles",
  "naked-single": "naked-single",
  "hidden-single": "hidden-single",
  "locked-candidate": "pointing-elimination",
  "naked-pair": "naked-pair",
  "hidden-pair": "hidden-pair",
  "hidden-groups": "hidden-groups",
  "x-wing": "x-wing",
  "y-wing": "y-wing",
  swordfish: "swordfish",
  jellyfish: "jellyfish",
  "xyz-wing": "xyz-wing",
  "wxyz-wing": "wxyz-wing",
  "empty-rectangle": "empty-rectangle",
  "x-chain": "x-chain",
  "xy-chain": "xy-chain",
  skyscraper: "skyscraper",
  "two-string-kite": "two-string-kite",
  crane: "crane",
  "w-wing": "w-wing",
  "simple-colouring": "simple-colouring",
  "finned-x-wing": "finned-x-wing",
  "finned-swordfish": "finned-swordfish",
  "finned-jellyfish": "finned-jellyfish",
  "unique-rectangle": "unique-rectangle",
  "bug+1": "bug-plus-one",
  "3d-medusa": "3d-medusa",
  aic: "aic",
  nishio: "nishio",
};

function loadExamples(): TechniqueExample[] {
  const file = path.join(
    __dirname,
    "..",
    "fixtures",
    "technique-examples.json",
  );
  return JSON.parse(fs.readFileSync(file, "utf8")) as TechniqueExample[];
}

function boardFromGivens(givens: string): Board {
  return [...givens].map((c) => {
    const n = Number(c);
    return n > 0 ? n : null;
  });
}

function filledCount(board: Board): number {
  return board.filter((v) => v != null && v > 0).length;
}

function toState(board: Board) {
  return stateFromValues(board.map((v) => (v == null ? 0 : v)) as number[]);
}

/** State from puzzle givens only (no mid-solve fills / candidate masks). */
function buildExampleState(example: TechniqueExample) {
  return toState(boardFromGivens(example.givens));
}

/** Unique solution of the givens only. Skip sparse / non-unique boards. */
function resolveSolution(example: TechniqueExample): number[] | null {
  const givens = boardFromGivens(example.givens);
  if (filledCount(givens) < 18) return null;
  return solutionForBoard(givens);
}

interface TacticBoard {
  id: string;
  tacticId: string;
  board: Board;
}

/** One entry per (board, tactic) pair the fixtures say should fire. */
const TACTIC_BOARDS: TacticBoard[] = [
  ...REGISTRY_BOARDS.map((b) => ({
    id: `registry ${b.tacticId}`,
    tacticId: b.tacticId,
    board: parsePuzzleString(b.puzzle),
  })),
  ...CURATED_BOARDS.flatMap((b) =>
    b.tacticIds.map((tacticId) => ({
      id: `curated ${b.label}`,
      tacticId,
      board: parsePuzzleString(b.puzzle),
    })),
  ),
];

describe("tactic trust — solution-preserving soundness", () => {
  const examples = loadExamples();

  it("never eliminates the true solution digit on technique examples", () => {
    const failures: string[] = [];
    let checked = 0;

    for (const example of examples) {
      const tacticId = TECHNIQUE_TO_TACTIC[example.technique];
      if (!tacticId) continue;
      const tactic = TACTICS.find((t) => t.id === tacticId);
      if (!tactic) continue;

      const solution = resolveSolution(example);
      if (!solution) continue;

      const state = buildExampleState(example);
      if (!state) continue;

      const { step } = findAfterBasics(state, tactic);
      if (!step) continue;

      checked++;
      const bad = assertEliminationsSound(
        step,
        solution,
        tactic.id,
        `${example.technique}#${example.exampleIndex}`,
      );
      if (bad) {
        failures.push(
          `${bad.context}: ${bad.tacticId} removed ${bad.eliminated} at ${bad.index} but solution is ${bad.solutionDigit}`,
        );
      }
    }

    expect(checked).toBeGreaterThan(40);
    expect(failures).toEqual([]);
  });

  it("never eliminates the true solution digit on fixture boards", () => {
    const failures: string[] = [];
    let checked = 0;

    for (const fixture of TACTIC_BOARDS) {
      const tactic = TACTICS.find((t) => t.id === fixture.tacticId);
      if (!tactic) continue;

      const solution = solutionForBoard(fixture.board);
      if (!solution) continue;

      const state = toState(fixture.board);
      if (!state) continue;

      const { step } = findAfterBasics(state, tactic);
      if (!step) continue;

      checked++;
      const bad = assertEliminationsSound(step, solution, tactic.id, fixture.id);
      if (bad) {
        failures.push(
          `${bad.context}: ${bad.tacticId} removed ${bad.eliminated} at ${bad.index} but solution is ${bad.solutionDigit}`,
        );
      }
    }

    expect(checked).toBeGreaterThan(20);
    expect(failures).toEqual([]);
  });

  it("never eliminates the true solution digit during full walkthroughs", () => {
    const failures: string[] = [];
    let boards = 0;

    const fullBoards: { id: string; board: Board }[] = [
      ...examples
        .filter((e) => e.clues >= 22)
        .map((e) => ({
          id: `${e.technique}#${e.exampleIndex}`,
          board: boardFromGivens(e.givens),
        }))
        .filter((e) => filledCount(e.board) >= 18),
      ...loadProjectEuler96(),
      ...REAL_WORLD_PUZZLES.map((p) => ({
        id: p.id,
        board: parsePuzzleString(p.puzzle),
      })),
    ];

    for (const puzzle of fullBoards) {
      const solution = solutionForBoard(puzzle.board);
      if (!solution) continue;
      const state = toState(puzzle.board);
      if (!state) continue;
      boards++;
      const path = walkthrough(state);
      for (const step of path.steps) {
        const bad = assertEliminationsSound(
          step,
          solution,
          step.strategy,
          `walk ${puzzle.id}`,
        );
        if (bad) {
          failures.push(
            `${bad.context}: removed ${bad.eliminated} at ${bad.index}, truth ${bad.solutionDigit}`,
          );
        }
      }
    }

    expect(boards).toBeGreaterThan(50);
    expect(failures).toEqual([]);
  });

  it.each(Object.entries(TECHNIQUE_TO_TACTIC))(
    "detects %s soundly from givens (unsound=0, hits when solvable)",
    (technique, tacticId) => {
      const tactic = TACTICS.find((t) => t.id === tacticId) as Tactic;
      const subset = examples.filter((e) => e.technique === technique);

      let solvable = 0;
      let detected = 0;
      let unsound = 0;

      for (const example of subset) {
        const solution = resolveSolution(example);
        if (!solution) continue;

        const state = buildExampleState(example);
        if (!state) continue;
        solvable++;

        const { step } = findAfterBasics(state, tactic);
        if (!step) continue;
        detected++;
        const bad = assertEliminationsSound(
          step,
          solution,
          tactic.id,
          `${technique}#${example.exampleIndex}`,
        );
        if (bad) unsound++;
      }

      // eslint-disable-next-line no-console
      console.log(
        `[trust ${technique}] detected ${detected}/${solvable} sound, unsound=${unsound}`,
      );

      expect(unsound).toBe(0);
      if (solvable === 0) return;
      // From givens-only, some teaching boards never expose that technique
      // on a priority walk — require at least one sound hit when we have samples.
      expect(detected).toBeGreaterThan(0);
    },
  );
});
