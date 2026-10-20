import { TACTICS } from "../../src/tactics/registry";
import type { Tactic } from "../../src/tactics/types";
import {
  assertEliminationsSound,
  findAfterBasics,
  solutionForBoard,
  stateFromValues,
} from "../helpers/trust";
import {
  REGISTRY_BOARDS,
  type RegistryBoardFixture,
} from "../fixtures/registry-boards";
import { parsePuzzleString } from "../fixtures/parse";

function fixtureFor(tacticId: string): RegistryBoardFixture {
  const f = REGISTRY_BOARDS.find((x) => x.tacticId === tacticId);
  if (!f) throw new Error(`No registry board for tactic ${tacticId}`);
  return f;
}

function loadState(puzzle: string) {
  const board = parsePuzzleString(puzzle);
  const solution = solutionForBoard(board);
  const state = stateFromValues(
    board.map((v) => (v == null ? 0 : v)) as number[],
  );
  return { board, solution, state };
}

describe("tactics / registry", () => {
  it("every registered tactic has a board fixture", () => {
    const fixtureIds = new Set(REGISTRY_BOARDS.map((f) => f.tacticId));
    const missing = TACTICS.filter((t) => !fixtureIds.has(t.id)).map(
      (t) => t.id,
    );
    expect(missing).toEqual([]);
  });

  it("fixture ids match registered tactics (no orphans)", () => {
    const registered = new Set(TACTICS.map((t) => t.id));
    const orphans = REGISTRY_BOARDS.filter(
      (f) => !registered.has(f.tacticId),
    ).map((f) => f.tacticId);
    expect(orphans).toEqual([]);
  });

  it.each(TACTICS.map((t) => [t.id, t] as const))(
    "%s fires on its fixture with a sound step",
    (tacticId, tactic: Tactic) => {
      const fixture = fixtureFor(tacticId);
      const { solution, state } = loadState(fixture.puzzle);

      expect(solution).not.toBeNull();
      expect(state).not.toBeNull();

      const { step } = findAfterBasics(state!, tactic);
      expect(step).not.toBeNull();
      expect(step!.strategy).toBe(tactic.title);
      expect(step!.updates.length).toBeGreaterThan(0);

      if (tactic.type === "value") {
        expect(step!.updates.every((u) => u.filledValue != null)).toBe(true);
        for (const u of step!.updates) {
          expect(u.filledValue).toBe(solution![u.index]);
        }
      } else {
        expect(step!.updates.every((u) => u.eliminatedCandidate != null)).toBe(
          true,
        );
        const bad = assertEliminationsSound(
          step!,
          solution!,
          tactic.id,
          fixture.source,
        );
        expect(bad).toBeNull();
      }
    },
  );
});
