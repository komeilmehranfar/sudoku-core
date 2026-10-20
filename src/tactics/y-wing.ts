import { CELL_COUNT } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { peersOf } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";

/**
 * Y-Wing (XY-Wing): pivot XY, pincers XZ and YZ → eliminate Z from peers of both pincers.
 */
export const yWingTactic: Tactic = {
  id: "y-wing",
  title: "Y-Wing Strategy",
  score: 140,
  rank: 4.2,
  type: "elimination",
  find(state: GridState) {
    const bivalue: { index: number; digits: number[] }[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      if (candidateCount(state.candidates[i]) !== 2) continue;
      bivalue.push({ index: i, digits: digitsFromMask(state.candidates[i]) });
    }

    for (const pivot of bivalue) {
      const [x, y] = pivot.digits;
      const peers = new Set(peersOf(pivot.index));

      const xz = bivalue.filter(
        (c) =>
          c.index !== pivot.index &&
          peers.has(c.index) &&
          c.digits.includes(x) &&
          !c.digits.includes(y),
      );
      const yz = bivalue.filter(
        (c) =>
          c.index !== pivot.index &&
          peers.has(c.index) &&
          c.digits.includes(y) &&
          !c.digits.includes(x),
      );

      for (const a of xz) {
        const z = a.digits.find((d) => d !== x)!;
        for (const b of yz) {
          if (!b.digits.includes(z)) continue;
          const peersA = new Set(peersOf(a.index));
          const peersB = peersOf(b.index);
          const updates: { index: number; eliminatedCandidate: number }[] = [];
          for (const idx of peersB) {
            if (!peersA.has(idx)) continue;
            if (idx === pivot.index || idx === a.index || idx === b.index)
              continue;
            if (state.values[idx] !== 0) continue;
            if (hasDigit(state.candidates[idx], z)) {
              updates.push({ index: idx, eliminatedCandidate: z });
            }
          }
          if (updates.length > 0) {
            const patternCells = [pivot.index, a.index, b.index];
            return step(
              { title: "Y-Wing Strategy", type: "elimination" },
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
    return null;
  },
};
