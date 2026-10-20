import { BOARD_SIZE, STEP_TYPE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { HOUSES, peersOf } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

/**
 * X-Chain (open): strong–weak–strong… on one digit.
 * Strong = conjugate (exactly two candidates in a house).
 * Ends of an open chain → eliminate digit from cells seeing both ends.
 */
export const xChainTactic: Tactic = {
  id: TACTIC_ID.X_CHAIN,
  title: STRATEGY.X_CHAIN,
  score: 260,
  rank: 6.6,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    for (let digit = 1; digit <= BOARD_SIZE; digit++) {
      const strong = buildStrongLinks(state, digit);
      const cells = [...strong.keys()];
      if (cells.length < 2) continue;

      for (const start of cells) {
        // path always ends on a cell reached via a strong link
        const stack: number[][] = [];
        for (const a of strong.get(start) ?? []) {
          stack.push([start, a]);
        }

        while (stack.length) {
          const path = stack.pop()!;
          if (path.length > 14) continue;
          const end = path[path.length - 1];

          if (path.length >= 4) {
            const updates = elimSeeingBoth(state, digit, start, end, path);
            if (updates.length > 0) {
              return step(
                { title: STRATEGY.X_CHAIN, type: STEP_TYPE.ELIMINATION },
                updates,
                {
                  patternCells: path,
                  regionCells: regionFromCells(path),
                },
              );
            }
          }

          // weak link to a peer, then strong out
          for (const peer of peersOf(end)) {
            if (path.includes(peer)) continue;
            if (state.values[peer] !== 0) continue;
            if (!hasDigit(state.candidates[peer], digit)) continue;
            for (const next of strong.get(peer) ?? []) {
              if (path.includes(next) || next === end) continue;
              stack.push([...path, peer, next]);
            }
          }
        }
      }
    }
    return null;
  },
};

function buildStrongLinks(
  state: GridState,
  digit: number,
): Map<number, number[]> {
  const map = new Map<number, number[]>();
  const add = (a: number, b: number) => {
    if (!map.has(a)) map.set(a, []);
    if (!map.get(a)!.includes(b)) map.get(a)!.push(b);
  };
  for (const group of HOUSES) {
    for (const house of group) {
      const hits: number[] = [];
      for (const idx of house) {
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
      }
      if (hits.length === 2) {
        add(hits[0], hits[1]);
        add(hits[1], hits[0]);
      }
    }
  }
  return map;
}

function elimSeeingBoth(
  state: GridState,
  digit: number,
  a: number,
  b: number,
  chain: number[],
) {
  if (a === b) return [];
  const peersA = new Set(peersOf(a));
  const used = new Set(chain);
  const updates: { index: number; eliminatedCandidate: number }[] = [];
  for (const idx of peersOf(b)) {
    if (!peersA.has(idx) || used.has(idx)) continue;
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], digit)) {
      updates.push({ index: idx, eliminatedCandidate: digit });
    }
  }
  return updates;
}
