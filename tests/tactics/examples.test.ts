import * as fs from "fs";
import * as path from "path";
import {
  createEmptyGrid,
  placeValue,
  type GridState,
} from "../../src/board/board";
import { walkthrough } from "../../src/tactics/apply";
import { TACTICS } from "../../src/tactics/registry";
import type { Tactic } from "../../src/tactics/types";
import { isUniqueSolution } from "../../src/uniqueness/count-solutions";
import type { Board } from "../../src/types";

interface TechniqueExample {
  technique: string;
  exampleIndex: number;
  givens: string;
  values: number[];
  masks: number[] | null;
  clues: number;
}

/** Map example technique slug → our tactic ids that should cover it. */
const TECHNIQUE_TO_TACTICS: Record<string, string[]> = {
  "last-digit": ["open-singles"],
  "naked-single": ["naked-single", "open-singles"],
  "hidden-single": ["hidden-single"],
  "locked-candidate": ["pointing-elimination"],
  "naked-pair": ["naked-pair"],
  "hidden-pair": ["hidden-pair"],
  "hidden-groups": ["hidden-groups", "hidden-triple", "hidden-quad"],
  "x-wing": ["x-wing"],
  "y-wing": ["y-wing"],
  swordfish: ["swordfish"],
  jellyfish: ["jellyfish"],
  "xyz-wing": ["xyz-wing"],
  "wxyz-wing": ["wxyz-wing"],
  "empty-rectangle": ["empty-rectangle"],
  "x-chain": ["x-chain"],
  "xy-chain": ["xy-chain"],
  skyscraper: ["skyscraper"],
  "two-string-kite": ["two-string-kite"],
  crane: ["crane"],
  "w-wing": ["w-wing"],
  "simple-colouring": ["simple-colouring"],
  "finned-x-wing": ["finned-x-wing"],
  "finned-swordfish": ["finned-swordfish"],
  "finned-jellyfish": ["finned-jellyfish"],
  "unique-rectangle": ["unique-rectangle"],
  "bug+1": ["bug-plus-one"],
  "3d-medusa": ["3d-medusa"],
  aic: ["aic"],
  nishio: ["nishio"],
};

function loadExamples(): TechniqueExample[] {
  const file = path.join(__dirname, "..", "fixtures", "technique-examples.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as TechniqueExample[];
}

function buildState(example: TechniqueExample): GridState | null {
  const state = createEmptyGrid();
  for (let i = 0; i < 81; i++) {
    const v = example.values[i];
    if (!v) continue;
    if (!placeValue(state, i, v)) return null; // conflict / invalid teaching fragment
  }
  // Examples store candidate bitmasks with bit N = digit N (bit0 unused).
  if (example.masks && example.masks.some((m) => m > 0)) {
    for (let i = 0; i < 81; i++) {
      if (state.values[i] !== 0) {
        state.candidates[i] = 0;
        continue;
      }
      const mask = example.masks[i] ?? 0;
      state.candidates[i] = mask >> 1; // convert to bit(d-1)
    }
  }
  return state;
}

function tacticsFor(technique: string): Tactic[] {
  const ids = TECHNIQUE_TO_TACTICS[technique];
  if (!ids) return [];
  return TACTICS.filter((t) => ids.includes(t.id));
}

describe("technique example boards", () => {
  const examples = loadExamples();

  it("loads the technique examples", () => {
    expect(examples.length).toBeGreaterThan(100);
  });

  describe("technique detection on example states", () => {
    const inFixtures = [...new Set(examples.map((e) => e.technique))].filter(
      (t) => TECHNIQUE_TO_TACTICS[t],
    );

    it.each(inFixtures)(
      "detects %s on at least one example (when state is valid)",
      (technique) => {
        const subset = examples.filter((e) => e.technique === technique);
        expect(subset.length).toBeGreaterThan(0);

        const tactics = tacticsFor(technique);
        let detected = 0;
        let validStates = 0;

        for (const example of subset) {
          const state = buildState(example);
          if (!state) continue;
          validStates++;
          const hit = tactics.some((t) => t.find(state) != null);
          if (hit) detected++;
        }

        // Teaching fragments / progressive slides often aren't a clean
        // "find this tactic now" state — require at least one hit when we
        // have valid states, else document zero.
        if (validStates === 0) {
          console.warn(`[${technique}] no valid placeable states`);
          return;
        }
        console.log(
          `[${technique}] detected ${detected}/${validStates} valid examples`,
        );
        expect(detected).toBeGreaterThan(0);
      },
    );
  });

  describe("full unique boards (≥22 clues) human-solvable?", () => {
    const full = examples.filter((e) => e.clues >= 22);

    it("reports coverage summary for full example boards", () => {
      const byTech: Record<
        string,
        { total: number; unique: number; humanSolved: number }
      > = {};

      for (const example of full) {
        // Uniqueness + solve from givens only (ignore mid-solve values/masks)
        const board: Board = [...example.givens].map((c) => {
          const n = Number(c);
          return n > 0 ? n : null;
        });
        const bucket = (byTech[example.technique] ||= {
          total: 0,
          unique: 0,
          humanSolved: 0,
        });
        bucket.total++;

        let unique = false;
        try {
          unique = isUniqueSolution(board);
        } catch {
          continue;
        }
        if (!unique) continue;
        bucket.unique++;

        const fromGivens = createEmptyGrid();
        let ok = true;
        for (let i = 0; i < 81; i++) {
          const g = board[i];
          if (g == null) continue;
          if (!placeValue(fromGivens, i, g)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        const path = walkthrough(fromGivens);
        if (path.solved) bucket.humanSolved++;
      }

      console.log(
        "\nFull-board coverage (≥22 clues):\n" +
          Object.entries(byTech)
            .map(
              ([tech, s]) =>
                `  ${tech}: unique=${s.unique}/${s.total}, humanSolved=${s.humanSolved}`,
            )
            .join("\n"),
      );

      // Soft assertion: we should human-solve at least some classic boards.
      const solvedTotal = Object.values(byTech).reduce(
        (a, b) => a + b.humanSolved,
        0,
      );
      expect(solvedTotal).toBeGreaterThan(0);
    });
  });

  describe("gap report — techniques we cannot cover yet", () => {
    it("lists example techniques with no mapped tactic", () => {
      const allTechs = [...new Set(examples.map((e) => e.technique))].sort();
      const gaps = allTechs.filter((t) => !TECHNIQUE_TO_TACTICS[t]);
      console.log(
        "\nExample techniques with no mapped tactic:\n" +
          gaps
            .map(
              (g) =>
                `  - ${g} (${
                  examples.filter((e) => e.technique === g).length
                } examples)`,
            )
            .join("\n"),
      );
      // Informational — empty means full coverage of techniques present in the JSON.
      expect(gaps).toEqual([]);
    });
  });
});
