import { BOARD_SIZE, CELL_COUNT, STEP_TYPE } from "../board/constants";
import { candidateCount, digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES, peersOf } from "../board/houses";
import type { GridState } from "../board/board";
import { regionFromCells, step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

type Node = string; // `${cell}:${digit}`

function node(cell: number, digit: number): Node {
  return `${cell}:${digit}`;
}

function parse(n: Node): { cell: number; digit: number } {
  const [c, d] = n.split(":").map(Number);
  return { cell: c, digit: d };
}

/**
 * AIC (Alternating Inference Chain) — open chains of strong/weak links.
 * Same-digit endpoints → eliminate from common peers.
 * Same-cell endpoints → strip other candidates.
 */
export const aicTactic: Tactic = {
  id: TACTIC_ID.AIC,
  title: STRATEGY.AIC,
  score: 340,
  rank: 7.5,
  type: STEP_TYPE.ELIMINATION,
  find(state: GridState) {
    const strong = buildStrong(state);
    const weak = buildWeak(state);
    // Strong links may be used as weak links.
    for (const [a, bs] of strong) {
      for (const b of bs) {
        if (!weak.has(a)) weak.set(a, []);
        if (!weak.get(a)!.includes(b)) weak.get(a)!.push(b);
      }
    }

    const nodes = [...strong.keys()];
    if (nodes.length < 2) return null;

    for (const start of nodes) {
      for (const first of strong.get(start) ?? []) {
        const stack: { path: Node[]; needStrong: boolean }[] = [
          { path: [start, first], needStrong: false },
        ];

        while (stack.length) {
          const { path, needStrong } = stack.pop()!;
          if (path.length > 16) continue;
          const end = path[path.length - 1];

          if (path.length >= 4 && !needStrong) {
            const updates = elimFromEndpoints(state, path[0], end);
            if (updates.length > 0) {
              const patternCells = [...new Set(path.map((n) => parse(n).cell))];
              return step(
                { title: STRATEGY.AIC, type: STEP_TYPE.ELIMINATION },
                updates,
                {
                  patternCells,
                  regionCells: regionFromCells(patternCells),
                },
              );
            }
          }

          const nextMap = needStrong ? strong : weak;
          for (const nxt of nextMap.get(end) ?? []) {
            if (path.includes(nxt)) continue;
            stack.push({
              path: [...path, nxt],
              needStrong: !needStrong,
            });
          }
        }
      }
    }
    return null;
  },
};

function buildStrong(state: GridState): Map<Node, Node[]> {
  const map = new Map<Node, Node[]>();
  const add = (a: Node, b: Node) => {
    if (!map.has(a)) map.set(a, []);
    if (!map.get(a)!.includes(b)) map.get(a)!.push(b);
  };

  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    for (const group of HOUSES) {
      for (const house of group) {
        const hits: number[] = [];
        for (const idx of house) {
          if (state.values[idx] !== 0) continue;
          if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
        }
        if (hits.length === 2) {
          add(node(hits[0], digit), node(hits[1], digit));
          add(node(hits[1], digit), node(hits[0], digit));
        }
      }
    }
  }

  for (let i = 0; i < CELL_COUNT; i++) {
    if (state.values[i] !== 0) continue;
    if (candidateCount(state.candidates[i]) !== 2) continue;
    const [d1, d2] = digitsFromMask(state.candidates[i]);
    add(node(i, d1), node(i, d2));
    add(node(i, d2), node(i, d1));
  }
  return map;
}

function buildWeak(state: GridState): Map<Node, Node[]> {
  const map = new Map<Node, Node[]>();
  const add = (a: Node, b: Node) => {
    if (!map.has(a)) map.set(a, []);
    if (!map.get(a)!.includes(b)) map.get(a)!.push(b);
  };

  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    for (const group of HOUSES) {
      for (const house of group) {
        const hits: number[] = [];
        for (const idx of house) {
          if (state.values[idx] !== 0) continue;
          if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
        }
        for (let i = 0; i < hits.length; i++) {
          for (let j = i + 1; j < hits.length; j++) {
            add(node(hits[i], digit), node(hits[j], digit));
            add(node(hits[j], digit), node(hits[i], digit));
          }
        }
      }
    }
  }

  for (let i = 0; i < CELL_COUNT; i++) {
    if (state.values[i] !== 0) continue;
    const digits = digitsFromMask(state.candidates[i]);
    for (let a = 0; a < digits.length; a++) {
      for (let b = a + 1; b < digits.length; b++) {
        add(node(i, digits[a]), node(i, digits[b]));
        add(node(i, digits[b]), node(i, digits[a]));
      }
    }
  }
  return map;
}

function elimFromEndpoints(state: GridState, start: Node, end: Node) {
  const s = parse(start);
  const e = parse(end);
  const updates: { index: number; eliminatedCandidate: number }[] = [];

  if (s.digit === e.digit && s.cell !== e.cell) {
    const peersS = new Set(peersOf(s.cell));
    for (const idx of peersOf(e.cell)) {
      if (!peersS.has(idx) || idx === s.cell || idx === e.cell) continue;
      if (state.values[idx] !== 0) continue;
      if (hasDigit(state.candidates[idx], s.digit)) {
        updates.push({ index: idx, eliminatedCandidate: s.digit });
      }
    }
  } else if (s.cell === e.cell && s.digit !== e.digit) {
    for (const d of digitsFromMask(state.candidates[s.cell])) {
      if (d === s.digit || d === e.digit) continue;
      updates.push({ index: s.cell, eliminatedCandidate: d });
    }
  }

  const seen = new Set<string>();
  return updates.filter((u) => {
    const k = `${u.index}:${u.eliminatedCandidate}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
