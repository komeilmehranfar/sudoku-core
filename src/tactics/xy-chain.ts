import { CELL_COUNT, STEP_TYPE } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { peersOf } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

/**
 * XY-Chain: chain of bivalue cells. Consecutive cells share a house and a
 * linking digit. If endpoints both contain Z and the chain shows
 * ¬Z@start ⇒ Z@end, then Z can be eliminated from common peers.
 */
export const xyChainTactic: Tactic = {
  id: TACTIC_ID.XY_CHAIN,
  title: STRATEGY.XY_CHAIN,
  score: 300,
  rank: 6.8,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    const bivalue: { index: number; digits: [number, number] }[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      if (candidateCount(state.candidates[i]) !== 2) continue;
      const d = digitsFromMask(state.candidates[i]);
      bivalue.push({ index: i, digits: [d[0], d[1]] });
    }
    if (bivalue.length < 3) return null;

    const byIndex = new Map(bivalue.map((c) => [c.index, c]));
    // Prefer shorter chains (Y-Wing-shaped first)
    let best: ReturnType<typeof step> | null = null;
    let bestLen = Infinity;

    for (const start of bivalue) {
      for (const z of start.digits) {
        const onDigit =
          start.digits[0] === z ? start.digits[1] : start.digits[0];
        const stack: { path: number[]; onDigit: number }[] = [
          { path: [start.index], onDigit },
        ];

        while (stack.length) {
          const { path, onDigit: currentOn } = stack.pop()!;
          if (path.length > 12 || path.length >= bestLen) continue;
          const endIdx = path[path.length - 1];

          if (
            path.length >= 3 &&
            currentOn === z &&
            hasDigit(state.candidates[endIdx], z)
          ) {
            const updates = elimZ(state, z, start.index, endIdx, path);
            if (updates.length > 0 && path.length < bestLen) {
              bestLen = path.length;
              best = step(
                { title: STRATEGY.XY_CHAIN, type: STEP_TYPE.ELIMINATION },
                updates,
                {
                  patternCells: path,
                  regionCells: regionFromCells(path),
                },
              );
              if (bestLen === 3) return best;
            }
          }

          for (const peer of peersOf(endIdx)) {
            if (path.includes(peer)) continue;
            const next = byIndex.get(peer);
            if (!next) continue;
            if (!next.digits.includes(currentOn)) continue;
            const nextOn =
              next.digits[0] === currentOn ? next.digits[1] : next.digits[0];
            stack.push({ path: [...path, peer], onDigit: nextOn });
          }
        }
      }
    }
    return best;
  },
};

function elimZ(
  state: GridState,
  z: number,
  a: number,
  b: number,
  path: number[],
) {
  const peersA = new Set(peersOf(a));
  const used = new Set(path);
  const updates: { index: number; eliminatedCandidate: number }[] = [];
  for (const idx of peersOf(b)) {
    if (!peersA.has(idx) || used.has(idx)) continue;
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], z)) {
      updates.push({ index: idx, eliminatedCandidate: z });
    }
  }
  return updates;
}
