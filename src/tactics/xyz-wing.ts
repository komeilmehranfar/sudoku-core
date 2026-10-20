import { CELL_COUNT } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { peersOf } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";

/**
 * XYZ-Wing: pivot XYZ (3 candidates), pincers XZ and YZ →
 * eliminate Z from cells that see both pincers (and usually the pivot).
 */
export const xyzWingTactic: Tactic = {
  id: "xyz-wing",
  title: "XYZ-Wing Strategy",
  score: 180,
  rank: 4.4,
  type: "elimination",
  find(state: GridState) {
    const cells: { index: number; digits: number[] }[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      const n = candidateCount(state.candidates[i]);
      if (n < 2 || n > 3) continue;
      cells.push({ index: i, digits: digitsFromMask(state.candidates[i]) });
    }

    const pivots = cells.filter((c) => c.digits.length === 3);
    const bivalue = cells.filter((c) => c.digits.length === 2);

    for (const pivot of pivots) {
      const [x, y, z] = pivot.digits;
      const peers = new Set(peersOf(pivot.index));
      const wings = bivalue.filter((c) => peers.has(c.index));

      for (let i = 0; i < wings.length; i++) {
        for (let j = i + 1; j < wings.length; j++) {
          const a = wings[i];
          const b = wings[j];
          // Wings must be XZ and YZ for some labeling of pivot digits
          for (const pair of [
            [x, y, z],
            [x, z, y],
            [y, z, x],
          ] as const) {
            const [p, q, common] = pair;
            const aOk =
              a.digits.includes(p) &&
              a.digits.includes(common) &&
              !a.digits.includes(q);
            const bOk =
              b.digits.includes(q) &&
              b.digits.includes(common) &&
              !b.digits.includes(p);
            if (!aOk || !bOk) continue;

            const peersA = new Set(peersOf(a.index));
            const peersB = peersOf(b.index);
            const updates: { index: number; eliminatedCandidate: number }[] =
              [];
            for (const idx of peersB) {
              if (!peersA.has(idx)) continue;
              if (idx === pivot.index || idx === a.index || idx === b.index)
                continue;
              // Classic XYZ also requires seeing the pivot
              if (!peers.has(idx)) continue;
              if (state.values[idx] !== 0) continue;
              if (hasDigit(state.candidates[idx], common)) {
                updates.push({
                  index: idx,
                  eliminatedCandidate: common,
                });
              }
            }
            if (updates.length > 0) {
              const patternCells = [pivot.index, a.index, b.index];
              return step(
                { title: "XYZ-Wing Strategy", type: "elimination" },
                updates,
                {
                  patternCells,
                  regionCells: regionFromCells(patternCells),
                },
              );
            }
          }
        }
      }
    }
    return null;
  },
};
