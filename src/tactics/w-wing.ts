import { CELL_COUNT, STEP_TYPE } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES, peersOf, sameHouse } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

/**
 * W-Wing: two bivalue cells A,B with the same candidates {x,z}, linked by a
 * strong link on x, so z cannot survive in any common peer.
 *
 * Strong link forms used here:
 * 1. A and B are themselves a conjugate pair for x (share a house, only two x's)
 * 2. An external conjugate {p,q} for x where A sees p, B sees q (A,B outside)
 */
export const wWingTactic: Tactic = {
  id: TACTIC_ID.W_WING,
  title: STRATEGY.W_WING,
  score: 170,
  rank: 4.3,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    const cells: { index: number; digits: [number, number] }[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      if (candidateCount(state.candidates[i]) !== 2) continue;
      const [a, b] = digitsFromMask(state.candidates[i]);
      cells.push({ index: i, digits: [a, b] });
    }

    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const A = cells[i];
        const B = cells[j];
        const setA = new Set(A.digits);
        if (!setA.has(B.digits[0]) || !setA.has(B.digits[1])) continue;
        if (A.digits[0] === A.digits[1]) continue;

        const x = A.digits[0];
        const z = A.digits[1];
        // Try both orientations of {x,z} as the strong-linked digit
        for (const [linkDigit, elimDigit] of [
          [x, z],
          [z, x],
        ] as const) {
          if (!strongLinkOnDigit(state, linkDigit, A.index, B.index)) continue;

          const peersA = new Set(peersOf(A.index));
          const updates: { index: number; eliminatedCandidate: number }[] = [];
          for (const idx of peersOf(B.index)) {
            if (!peersA.has(idx) || idx === A.index || idx === B.index)
              continue;
            if (state.values[idx] !== 0) continue;
            if (hasDigit(state.candidates[idx], elimDigit)) {
              updates.push({ index: idx, eliminatedCandidate: elimDigit });
            }
          }
          if (updates.length > 0) {
            const patternCells = [A.index, B.index];
            return step(
              { title: STRATEGY.W_WING, type: STEP_TYPE.ELIMINATION },
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

function strongLinkOnDigit(
  state: GridState,
  digit: number,
  cellA: number,
  cellB: number,
): boolean {
  // Form 1: A and B are the only two candidates for digit in some house
  for (const group of HOUSES) {
    for (const house of group) {
      if (!house.includes(cellA) || !house.includes(cellB)) continue;
      const hits: number[] = [];
      for (const idx of house) {
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
      }
      if (hits.length === 2 && hits.includes(cellA) && hits.includes(cellB)) {
        return true;
      }
    }
  }

  // Form 2: external conjugate p–q; A sees p, B sees q (disjoint)
  for (const group of HOUSES) {
    for (const house of group) {
      const hits: number[] = [];
      for (const idx of house) {
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
      }
      if (hits.length !== 2) continue;
      const [p, q] = hits;
      if (p === cellA || p === cellB || q === cellA || q === cellB) continue;

      const peersA = peersOf(cellA);
      const peersB = peersOf(cellB);
      if (
        (peersA.includes(p) && peersB.includes(q)) ||
        (peersA.includes(q) && peersB.includes(p))
      ) {
        // Prefer W-Wings where A and B don't already share a house with the
        // conjugate (keeps pattern distinct from simpler subset moves)
        if (sameHouse(cellA, cellB)) continue;
        return true;
      }
    }
  }

  return false;
}
