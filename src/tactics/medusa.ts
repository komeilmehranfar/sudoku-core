import { BOARD_SIZE, CELL_COUNT, STEP_TYPE } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES, peersOf } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

type NodeKey = string; // `${cell}:${digit}`

function key(cell: number, digit: number): NodeKey {
  return `${cell}:${digit}`;
}

function parse(k: NodeKey): { cell: number; digit: number } {
  const [c, d] = k.split(":").map(Number);
  return { cell: c, digit: d };
}

/**
 * 3D Medusa: colour the strong-link graph on (cell,digit) nodes where
 * strong links are bi-location conjugates and bi-value cells.
 * Apply common Medusa elimination rules (1–5).
 */
export const medusa3dTactic: Tactic = {
  id: TACTIC_ID.MEDUSA_3D,
  title: STRATEGY.MEDUSA_3D,
  score: 320,
  rank: 7.2,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    const adj = new Map<NodeKey, NodeKey[]>();
    const add = (a: NodeKey, b: NodeKey) => {
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.get(a)!.includes(b)) adj.get(a)!.push(b);
    };

    // Bi-location strong links
    for (let digit = 1; digit <= BOARD_SIZE; digit++) {
      for (const group of HOUSES) {
        for (const house of group) {
          const hits: number[] = [];
          for (const idx of house) {
            if (state.values[idx] !== 0) continue;
            if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
          }
          if (hits.length === 2) {
            const ka = key(hits[0], digit);
            const kb = key(hits[1], digit);
            add(ka, kb);
            add(kb, ka);
          }
        }
      }
    }

    // Bi-value strong links
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      if (candidateCount(state.candidates[i]) !== 2) continue;
      const [d1, d2] = digitsFromMask(state.candidates[i]);
      const ka = key(i, d1);
      const kb = key(i, d2);
      add(ka, kb);
      add(kb, ka);
    }

    const nodes = [...adj.keys()];
    if (nodes.length < 4) return null;

    const colour = new Map<NodeKey, 0 | 1>();
    const visited = new Set<NodeKey>();

    for (const start of nodes) {
      if (visited.has(start)) continue;
      const queue = [start];
      colour.set(start, 0);
      visited.add(start);
      const component: NodeKey[] = [start];
      let ok = true;
      while (queue.length) {
        const cur = queue.shift()!;
        const c = colour.get(cur)!;
        for (const n of adj.get(cur) ?? []) {
          if (!colour.has(n)) {
            colour.set(n, (1 - c) as 0 | 1);
            visited.add(n);
            queue.push(n);
            component.push(n);
          } else if (colour.get(n) === c) {
            ok = false;
          }
        }
      }
      if (!ok || component.length < 3) continue;

      const updates = applyMedusaRules(state, component, colour);
      if (updates.length > 0) {
        const patternCells = [...new Set(component.map((k) => parse(k).cell))];
        return step(
          { title: STRATEGY.MEDUSA_3D, type: STEP_TYPE.ELIMINATION },
          updates,
          {
            patternCells,
            regionCells: regionFromCells(patternCells),
          },
        );
      }
    }
    return null;
  },
};

function applyMedusaRules(
  state: GridState,
  component: NodeKey[],
  colour: Map<NodeKey, 0 | 1>,
): { index: number; eliminatedCandidate: number }[] {
  const compSet = new Set(component);
  const byCell = new Map<number, NodeKey[]>();
  for (const k of component) {
    const { cell } = parse(k);
    if (!byCell.has(cell)) byCell.set(cell, []);
    byCell.get(cell)!.push(k);
  }

  // Rule 1: same colour twice in a cell → that colour false
  for (const [, keys] of byCell) {
    for (const col of [0, 1] as const) {
      const same = keys.filter((k) => colour.get(k) === col);
      if (same.length >= 2) {
        return eliminateColour(state, component, colour, col);
      }
    }
  }

  // Rule 2: same digit + same colour twice in a unit → colour false
  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    for (const group of HOUSES) {
      for (const house of group) {
        for (const col of [0, 1] as const) {
          const same = house.filter((idx) => {
            const k = key(idx, digit);
            return compSet.has(k) && colour.get(k) === col;
          });
          if (same.length >= 2) {
            return eliminateColour(state, component, colour, col);
          }
        }
      }
    }
  }

  const updates: { index: number; eliminatedCandidate: number }[] = [];

  // Rule 3: cell has both colours → eliminate uncoloured candidates
  for (const [cell, keys] of byCell) {
    const colours = new Set(keys.map((k) => colour.get(k)!));
    if (colours.size < 2) continue;
    for (const d of digitsFromMask(state.candidates[cell])) {
      const k = key(cell, d);
      if (compSet.has(k)) continue;
      updates.push({ index: cell, eliminatedCandidate: d });
    }
  }

  // Rule 4: uncoloured candidate sees both colours of same digit
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (state.values[cell] !== 0) continue;
    for (const d of digitsFromMask(state.candidates[cell])) {
      const k = key(cell, d);
      if (compSet.has(k)) continue;
      let see0 = false;
      let see1 = false;
      for (const p of peersOf(cell)) {
        const pk = key(p, d);
        if (!compSet.has(pk)) continue;
        if (colour.get(pk) === 0) see0 = true;
        if (colour.get(pk) === 1) see1 = true;
      }
      if (see0 && see1) {
        updates.push({ index: cell, eliminatedCandidate: d });
      }
    }
  }

  // Rule 5: sees colour A in unit and opposite colour in same cell
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (state.values[cell] !== 0) continue;
    const cellKeys = byCell.get(cell) ?? [];
    for (const d of digitsFromMask(state.candidates[cell])) {
      const k = key(cell, d);
      if (compSet.has(k)) continue;
      for (const ck of cellKeys) {
        const cellCol = colour.get(ck)!;
        const opp = (1 - cellCol) as 0 | 1;
        // See opposite colour of digit d elsewhere?
        let seesOpp = false;
        for (const p of peersOf(cell)) {
          const pk = key(p, d);
          if (compSet.has(pk) && colour.get(pk) === opp) {
            seesOpp = true;
            break;
          }
        }
        if (seesOpp) {
          updates.push({ index: cell, eliminatedCandidate: d });
          break;
        }
      }
    }
  }

  return dedupe(updates);
}

function eliminateColour(
  state: GridState,
  component: NodeKey[],
  colour: Map<NodeKey, 0 | 1>,
  falseColour: 0 | 1,
) {
  const updates: { index: number; eliminatedCandidate: number }[] = [];
  for (const k of component) {
    if (colour.get(k) !== falseColour) continue;
    const { cell, digit } = parse(k);
    if (state.values[cell] !== 0) continue;
    if (hasDigit(state.candidates[cell], digit)) {
      updates.push({ index: cell, eliminatedCandidate: digit });
    }
  }
  return dedupe(updates);
}

function dedupe(updates: { index: number; eliminatedCandidate: number }[]) {
  const seen = new Set<string>();
  return updates.filter((u) => {
    const k = `${u.index}:${u.eliminatedCandidate}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
