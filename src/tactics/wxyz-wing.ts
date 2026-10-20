import { BOARD_SIZE, CELL_COUNT } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES, peersOf, sameHouse } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";

/**
 * WXYZ-Wing Type 1 (SudokuWiki / StrmCkr):
 * Four cells, four digits, in exactly two units; exactly one non-restricted
 * digit Z; eliminate Z from cells that see every Z in the pattern.
 *
 * Enumerates unit-pairs (not C(n,4) over the whole grid) so step-finding stays fast.
 */
export const wxyzWingTactic: Tactic = {
  id: "wxyz-wing",
  title: "WXYZ-Wing Strategy",
  score: 240,
  rank: 4.8,
  type: "elimination",
  find(state: GridState) {
    // Row + box
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let b = 0; b < BOARD_SIZE; b++) {
        const hit = searchInTwoUnits(state, HOUSES[0][r], HOUSES[2][b]);
        if (hit) return hit;
      }
    }
    // Col + box
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let b = 0; b < BOARD_SIZE; b++) {
        const hit = searchInTwoUnits(state, HOUSES[1][c], HOUSES[2][b]);
        if (hit) return hit;
      }
    }
    // Row + col
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const hit = searchInTwoUnits(state, HOUSES[0][r], HOUSES[1][c]);
        if (hit) return hit;
      }
    }
    return null;
  },
};

function searchInTwoUnits(
  state: GridState,
  unitA: readonly number[],
  unitB: readonly number[],
) {
  const inA = new Set(unitA);
  const inB = new Set(unitB);
  const cells: { index: number; mask: number }[] = [];

  for (const idx of new Set([...unitA, ...unitB])) {
    if (state.values[idx] !== 0) continue;
    // Must not be coverable by a single unit alone later — collect empties in union
    const n = candidateCount(state.candidates[idx]);
    if (n < 2 || n > 4) continue;
    cells.push({ index: idx, mask: state.candidates[idx] });
  }
  if (cells.length < 4) return null;

  for (let a = 0; a < cells.length; a++) {
    for (let b = a + 1; b < cells.length; b++) {
      for (let c = b + 1; c < cells.length; c++) {
        for (let d = c + 1; d < cells.length; d++) {
          const group = [cells[a], cells[b], cells[c], cells[d]];
          const indices = group.map((g) => g.index);

          // Must use both units (not a naked quad inside one)
          const onlyA = indices.every((i) => inA.has(i));
          const onlyB = indices.every((i) => inB.has(i));
          if (onlyA || onlyB) continue;
          if (!indices.every((i) => inA.has(i) || inB.has(i))) continue;

          const union =
            group[0].mask | group[1].mask | group[2].mask | group[3].mask;
          if (candidateCount(union) !== 4) continue;

          const digits = digitsFromMask(union);
          let z: number | null = null;
          for (const digit of digits) {
            if (!isRestrictedDigit(indices, group, digit)) {
              if (z != null) {
                z = null;
                break;
              }
              z = digit;
            }
          }
          if (z == null) continue;
          const zDigit = z;

          const zCells = indices.filter((_, i) =>
            hasDigit(group[i].mask, zDigit),
          );
          if (zCells.length < 2) continue;

          const groupSet = new Set(indices);
          const peerSets = zCells.map((zc) => new Set(peersOf(zc)));
          const updates: { index: number; eliminatedCandidate: number }[] = [];

          for (let t = 0; t < CELL_COUNT; t++) {
            if (groupSet.has(t) || state.values[t] !== 0) continue;
            if (!hasDigit(state.candidates[t], zDigit)) continue;
            if (peerSets.every((ps) => ps.has(t))) {
              updates.push({ index: t, eliminatedCandidate: zDigit });
            }
          }
          if (updates.length > 0) {
            return step(
              { title: "WXYZ-Wing Strategy", type: "elimination" },
              updates,
              {
                patternCells: indices,
                regionCells: regionFromCells(indices),
              },
            );
          }
        }
      }
    }
  }
  return null;
}

function isRestrictedDigit(
  indices: number[],
  group: { index: number; mask: number }[],
  digit: number,
): boolean {
  const holders = indices.filter((_, i) => hasDigit(group[i].mask, digit));
  if (holders.length <= 1) return true;
  for (let i = 0; i < holders.length; i++) {
    for (let j = i + 1; j < holders.length; j++) {
      if (!sameHouse(holders[i], holders[j])) return false;
    }
  }
  return true;
}
