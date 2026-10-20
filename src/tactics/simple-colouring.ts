import { BOARD_SIZE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { HOUSES, peersOf } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";

/**
 * Simple Colouring (single-digit conjugate colouring):
 * Colour the strong-link graph with two colours.
 * - Same colour twice in a unit → that colour is false
 * - A cell seeing both colours → eliminate the digit there
 */
export const simpleColouringTactic: Tactic = {
  id: "simple-colouring",
  title: "Simple Colouring Strategy",
  score: 180,
  rank: 4.5,
  type: "elimination",
  find(state: GridState) {
    for (let digit = 1; digit <= BOARD_SIZE; digit++) {
      const hit = colourDigit(state, digit);
      if (hit) return hit;
    }
    return null;
  },
};

function colourDigit(state: GridState, digit: number) {
  const adj = new Map<number, number[]>();
  const add = (a: number, b: number) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.get(a)!.includes(b)) adj.get(a)!.push(b);
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

  const nodes = [...adj.keys()];
  if (nodes.length < 2) return null;

  const colour = new Map<number, 0 | 1>();
  const visited = new Set<number>();

  for (const start of nodes) {
    if (visited.has(start)) continue;
    // BFS colour component
    const queue: number[] = [start];
    colour.set(start, 0);
    visited.add(start);
    let bipartite = true;
    while (queue.length) {
      const cur = queue.shift()!;
      const c = colour.get(cur)!;
      for (const n of adj.get(cur) ?? []) {
        if (!colour.has(n)) {
          colour.set(n, (1 - c) as 0 | 1);
          visited.add(n);
          queue.push(n);
        } else if (colour.get(n) === c) {
          bipartite = false;
        }
      }
    }
    if (!bipartite) continue;

    const component = [...colour.keys()].filter((k) => visited.has(k));
    // Restrict to this component only for rule checks — re-walk
    const compColour = new Map<number, 0 | 1>();
    for (const n of component) compColour.set(n, colour.get(n)!);

    // Rule: same colour twice in a unit → eliminate that colour
    for (const group of HOUSES) {
      for (const house of group) {
        for (const col of [0, 1] as const) {
          const same = house.filter(
            (idx) =>
              state.values[idx] === 0 &&
              hasDigit(state.candidates[idx], digit) &&
              compColour.get(idx) === col,
          );
          if (same.length >= 2) {
            const updates = eliminateColour(state, digit, compColour, col);
            if (updates.length > 0) {
              const patternCells = [...compColour.keys()];
              return step(
                { title: "Simple Colouring Strategy", type: "elimination" },
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

    // Rule: uncoloured cell seeing both colours
    const updates: { index: number; eliminatedCandidate: number }[] = [];
    for (let idx = 0; idx < 81; idx++) {
      if (state.values[idx] !== 0) continue;
      if (!hasDigit(state.candidates[idx], digit)) continue;
      if (compColour.has(idx)) continue;
      const peers = peersOf(idx);
      let see0 = false;
      let see1 = false;
      for (const p of peers) {
        if (compColour.get(p) === 0) see0 = true;
        if (compColour.get(p) === 1) see1 = true;
      }
      if (see0 && see1) {
        updates.push({ index: idx, eliminatedCandidate: digit });
      }
    }
    if (updates.length > 0) {
      const patternCells = [...compColour.keys()];
      return step(
        { title: "Simple Colouring Strategy", type: "elimination" },
        updates,
        {
          patternCells,
          regionCells: regionFromCells(patternCells),
        },
      );
    }

    // Clear colours for next component — colour map may mix; reset visited handling
    for (const n of component) colour.delete(n);
  }
  return null;
}

function eliminateColour(
  state: GridState,
  digit: number,
  colour: Map<number, 0 | 1>,
  falseColour: 0 | 1,
) {
  const updates: { index: number; eliminatedCandidate: number }[] = [];
  for (const [idx, c] of colour) {
    if (c !== falseColour) continue;
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], digit)) {
      updates.push({ index: idx, eliminatedCandidate: digit });
    }
  }
  return updates;
}
