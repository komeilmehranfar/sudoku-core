import { BOARD_SIZE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { CELL_HOUSES, HOUSES } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";
import type { SolvingStep } from "../types";

/**
 * Finned basic fish: almost a size-N fish, but one primary has extra
 * candidates (fins) in a single box. Eliminate from that box on the
 * fish secondary lines (excluding primary lines / fins).
 */
function findFinnedFish(
  state: GridState,
  size: 2 | 3 | 4,
  title: string,
): SolvingStep | null {
  const a = findFinnedOrientation(state, size, 0, 1, title);
  if (a) return a;
  return findFinnedOrientation(state, size, 1, 0, title);
}

function findFinnedOrientation(
  state: GridState,
  size: 2 | 3 | 4,
  primaryType: 0 | 1,
  secondaryType: 0 | 1,
  title: string,
): SolvingStep | null {
  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    const lines: { line: number; seconds: number[] }[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const house = HOUSES[primaryType][i];
      const seconds: number[] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        const idx = house[j];
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) seconds.push(j);
      }
      if (seconds.length >= 2) lines.push({ line: i, seconds });
    }
    if (lines.length < size) continue;

    for (const primaryIdxs of combinations(lines.length, size)) {
      const chosen = primaryIdxs.map((i) => lines[i]);
      for (let finIdx = 0; finIdx < size; finIdx++) {
        const finPrimary = chosen[finIdx];
        const rest = chosen.filter((_, i) => i !== finIdx);

        const restSeconds = new Set<number>();
        for (const r of rest) for (const s of r.seconds) restSeconds.add(s);
        if (restSeconds.size > size) continue;
        if (![...restSeconds].every((s) => finPrimary.seconds.includes(s)))
          continue;

        const S = new Set(restSeconds);
        for (const s of finPrimary.seconds) {
          if (S.size >= size) break;
          if (!S.has(s)) S.add(s);
        }
        if (S.size !== size) continue;
        if (rest.some((r) => r.seconds.some((s) => !S.has(s)))) continue;

        const fins = finPrimary.seconds.filter((s) => !S.has(s));
        if (fins.length === 0) continue;

        const finCells = fins.map(
          (s) => HOUSES[primaryType][finPrimary.line][s],
        );
        const boxes = new Set(finCells.map((i) => CELL_HOUSES[i][2]));
        if (boxes.size !== 1) continue;
        const finBox = [...boxes][0];

        const primarySet = new Set(chosen.map((c) => c.line));
        const updates: { index: number; eliminatedCandidate: number }[] = [];
        for (const sec of S) {
          const house = HOUSES[secondaryType][sec];
          for (let p = 0; p < BOARD_SIZE; p++) {
            if (primarySet.has(p)) continue;
            const idx = house[p];
            if (CELL_HOUSES[idx][2] !== finBox) continue;
            if (state.values[idx] !== 0) continue;
            if (!hasDigit(state.candidates[idx], digit)) continue;
            updates.push({ index: idx, eliminatedCandidate: digit });
          }
        }
        if (updates.length > 0) {
          const patternCells: number[] = [];
          for (const line of chosen) {
            for (const s of line.seconds) {
              patternCells.push(HOUSES[primaryType][line.line][s]);
            }
          }
          const regionCells = [
            ...new Set([
              ...chosen.flatMap((c) => [...HOUSES[primaryType][c.line]]),
              ...[...S].flatMap((s) => [...HOUSES[secondaryType][s]]),
              ...HOUSES[2][finBox],
            ]),
          ];
          return step(
            { title, type: "elimination" },
            updates,
            { patternCells, regionCells },
          );
        }
      }
    }
  }
  return null;
}

function combinations(n: number, k: number): number[][] {
  const result: number[][] = [];
  const cur: number[] = [];
  function dfs(start: number) {
    if (cur.length === k) {
      result.push(cur.slice());
      return;
    }
    for (let i = start; i < n; i++) {
      cur.push(i);
      dfs(i + 1);
      cur.pop();
    }
  }
  dfs(0);
  return result;
}

export const finnedXWingTactic: Tactic = {
  id: "finned-x-wing",
  title: "Finned X-Wing Strategy",
  score: 190,
  rank: 4.7,
  type: "elimination",
  find(state) {
    return findFinnedFish(state, 2, "Finned X-Wing Strategy");
  },
};

export const finnedSwordfishTactic: Tactic = {
  id: "finned-swordfish",
  title: "Finned Swordfish Strategy",
  score: 220,
  rank: 5.0,
  type: "elimination",
  find(state) {
    return findFinnedFish(state, 3, "Finned Swordfish Strategy");
  },
};

export const finnedJellyfishTactic: Tactic = {
  id: "finned-jellyfish",
  title: "Finned Jellyfish Strategy",
  score: 260,
  rank: 5.4,
  type: "elimination",
  find(state) {
    return findFinnedFish(state, 4, "Finned Jellyfish Strategy");
  },
};
