import { TACTICS } from "../../src/tactics/registry";
import {
  assertEliminationsSound,
  findAfterBasics,
  solutionForBoard,
  stateFromValues,
} from "../helpers/trust";
import { parsePuzzleString } from "../fixtures/parse";
import { isUniqueSolution } from "../../src/uniqueness/count-solutions";
import { CURATED_BOARDS } from "../fixtures/curated-boards";

describe("tactics / curated boards", () => {
  it.each(CURATED_BOARDS.map((p, i) => [`${p.label}#${i}`, p] as const))(
    "%s fires the expected tactic",
    (_id, entry) => {
      expect(entry.puzzle).toHaveLength(81);
      const board = parsePuzzleString(entry.puzzle);
      if (entry.expectUnique !== false) {
        expect(isUniqueSolution(board)).toBe(true);
      }

      const tactics = entry.tacticIds
        .map((id) => TACTICS.find((t) => t.id === id))
        .filter((t): t is NonNullable<typeof t> => t != null);
      expect(tactics.length).toBeGreaterThan(0);

      const state = stateFromValues(
        board.map((v) => (v == null ? 0 : v)) as number[],
      );
      expect(state).not.toBeNull();

      const sol = solutionForBoard(board);
      let hit = false;
      for (const tactic of tactics) {
        const { step } = findAfterBasics(state!, tactic);
        if (!step) continue;
        hit = true;
        expect(step.strategy).toBe(tactic.title);
        expect(step.updates.length).toBeGreaterThan(0);

        if (sol && tactic.type === "elimination") {
          expect(
            assertEliminationsSound(step, sol, tactic.id, entry.label),
          ).toBeNull();
        }
        if (sol && tactic.type === "value") {
          for (const u of step.updates) {
            if (u.filledValue != null) {
              expect(u.filledValue).toBe(sol[u.index]);
            }
          }
        }
        break;
      }
      expect(hit).toBe(true);
    },
  );
});
