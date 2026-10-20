import { BOARD_SIZE, STEP_TYPE } from "../board/constants";
import { hasDigit } from "../board/candidates";
import { CELL_HOUSES, HOUSES, peersOf, sameHouse } from "../board/houses";
import type { GridState } from "../board/board";
import { step, type Tactic } from "./types";
import { STRATEGY, TACTIC_ID } from "./names";

function elimTails(
  state: GridState,
  digit: number,
  t1: number,
  t2: number,
): { index: number; eliminatedCandidate: number }[] {
  if (t1 === t2) return [];
  const peers1 = new Set(peersOf(t1));
  const updates: { index: number; eliminatedCandidate: number }[] = [];
  for (const idx of peersOf(t2)) {
    if (!peers1.has(idx) || idx === t1 || idx === t2) continue;
    if (state.values[idx] !== 0) continue;
    if (hasDigit(state.candidates[idx], digit)) {
      updates.push({ index: idx, eliminatedCandidate: digit });
    }
  }
  return updates;
}

function findSkyscraper(state: GridState) {
  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    const rowPairs: { row: number; cols: number[] }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const cols: number[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * 9 + c;
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) cols.push(c);
      }
      if (cols.length === 2) rowPairs.push({ row: r, cols });
    }
    for (let i = 0; i < rowPairs.length; i++) {
      for (let j = i + 1; j < rowPairs.length; j++) {
        const a = rowPairs[i];
        const b = rowPairs[j];
        const shared = a.cols.filter((c) => b.cols.includes(c));
        if (shared.length !== 1) continue;
        const sc = shared[0];
        const cA = a.cols.find((c) => c !== sc)!;
        const cB = b.cols.find((c) => c !== sc)!;
        if (cA === cB) continue;
        const t1 = a.row * 9 + cA;
        const t2 = b.row * 9 + cB;
        const linkA = a.row * 9 + sc;
        const linkB = b.row * 9 + sc;
        const updates = elimTails(state, digit, t1, t2);
        if (updates.length > 0) {
          return step(
            { title: STRATEGY.SKYSCRAPER, type: STEP_TYPE.ELIMINATION },
            updates,
            {
              patternCells: [t1, t2, linkA, linkB],
              regionCells: [
                ...new Set([
                  ...HOUSES[0][a.row],
                  ...HOUSES[0][b.row],
                  ...HOUSES[1][sc],
                ]),
              ],
            },
          );
        }
      }
    }

    const colPairs: { col: number; rows: number[] }[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const rows: number[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        const idx = r * 9 + c;
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) rows.push(r);
      }
      if (rows.length === 2) colPairs.push({ col: c, rows });
    }
    for (let i = 0; i < colPairs.length; i++) {
      for (let j = i + 1; j < colPairs.length; j++) {
        const a = colPairs[i];
        const b = colPairs[j];
        const shared = a.rows.filter((r) => b.rows.includes(r));
        if (shared.length !== 1) continue;
        const sr = shared[0];
        const rA = a.rows.find((r) => r !== sr)!;
        const rB = b.rows.find((r) => r !== sr)!;
        if (rA === rB) continue;
        const t1 = rA * 9 + a.col;
        const t2 = rB * 9 + b.col;
        const linkA = sr * 9 + a.col;
        const linkB = sr * 9 + b.col;
        const updates = elimTails(state, digit, t1, t2);
        if (updates.length > 0) {
          return step(
            { title: STRATEGY.SKYSCRAPER, type: STEP_TYPE.ELIMINATION },
            updates,
            {
              patternCells: [t1, t2, linkA, linkB],
              regionCells: [
                ...new Set([
                  ...HOUSES[1][a.col],
                  ...HOUSES[1][b.col],
                  ...HOUSES[0][sr],
                ]),
              ],
            },
          );
        }
      }
    }
  }
  return null;
}

function findTwoStringKite(state: GridState) {
  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    const rowPairs: { row: number; cols: number[] }[] = [];
    const colPairs: { col: number; rows: number[] }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const cols: number[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * 9 + c;
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) cols.push(c);
      }
      if (cols.length === 2) rowPairs.push({ row: r, cols });
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      const rows: number[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        const idx = r * 9 + c;
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) rows.push(r);
      }
      if (rows.length === 2) colPairs.push({ col: c, rows });
    }

    for (const rp of rowPairs) {
      for (const cp of colPairs) {
        for (const rc of rp.cols) {
          for (const rr of cp.rows) {
            const rowEnd = rp.row * 9 + rc;
            const colEnd = rr * 9 + cp.col;
            if (rowEnd === colEnd) continue;
            const [, , b1] = CELL_HOUSES[rowEnd];
            const [, , b2] = CELL_HOUSES[colEnd];
            if (b1 !== b2) continue;
            const t1 =
              rp.row * 9 + (rp.cols[0] === rc ? rp.cols[1] : rp.cols[0]);
            const t2 =
              (cp.rows[0] === rr ? cp.rows[1] : cp.rows[0]) * 9 + cp.col;
            if (t1 === t2 || t1 === colEnd || t2 === rowEnd) continue;
            const updates = elimTails(state, digit, t1, t2);
            if (updates.length > 0) {
              const boxCells = [...HOUSES[2][b1]];
              const rowCells = [...HOUSES[0][rp.row]];
              const colCells = [...HOUSES[1][cp.col]];
              return step(
                {
                  title: STRATEGY.TWO_STRING_KITE,
                  type: STEP_TYPE.ELIMINATION,
                },
                updates,
                {
                  patternCells: [t1, t2, rowEnd, colEnd],
                  regionCells: [
                    ...new Set([...rowCells, ...colCells, ...boxCells]),
                  ],
                },
              );
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Crane: turbot fish with a box conjugate + a row/col conjugate
 * joined by a weak link (the linked ends see each other, distinct cells).
 * Strong–weak–strong ⇒ at least one free end is true ⇒ clear common peers.
 */
function findCrane(state: GridState) {
  for (let digit = 1; digit <= BOARD_SIZE; digit++) {
    const boxPairs: { a: number; b: number }[] = [];
    for (const house of HOUSES[2]) {
      const hits: number[] = [];
      for (const idx of house) {
        if (state.values[idx] !== 0) continue;
        if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
      }
      if (hits.length === 2) boxPairs.push({ a: hits[0], b: hits[1] });
    }

    const linePairs: { a: number; b: number }[] = [];
    for (let kind = 0; kind <= 1; kind++) {
      for (const house of HOUSES[kind]) {
        const hits: number[] = [];
        for (const idx of house) {
          if (state.values[idx] !== 0) continue;
          if (hasDigit(state.candidates[idx], digit)) hits.push(idx);
        }
        if (hits.length === 2) linePairs.push({ a: hits[0], b: hits[1] });
      }
    }

    for (const bp of boxPairs) {
      for (const lp of linePairs) {
        const boxEnds = [bp.a, bp.b];
        const lineEnds = [lp.a, lp.b];
        // Skip identical pairs
        if (
          (bp.a === lp.a && bp.b === lp.b) ||
          (bp.a === lp.b && bp.b === lp.a)
        ) {
          continue;
        }
        for (const be of boxEnds) {
          for (const le of lineEnds) {
            if (be === le) continue;
            if (!sameHouse(be, le)) continue;
            const t1 = boxEnds[0] === be ? boxEnds[1] : boxEnds[0];
            const t2 = lineEnds[0] === le ? lineEnds[1] : lineEnds[0];
            if (t1 === t2 || t1 === le || t2 === be) continue;
            // Free ends must not see each other via the weak middle only
            const updates = elimTails(state, digit, t1, t2);
            if (updates.length > 0) {
              const [, , box] = CELL_HOUSES[be];
              const [lr, lc] = CELL_HOUSES[le];
              const [tr, tc] = CELL_HOUSES[t2];
              const lineHouse =
                lr === tr
                  ? [...HOUSES[0][lr]]
                  : [...HOUSES[1][lc === tc ? lc : tc]];
              return step(
                { title: STRATEGY.CRANE, type: STEP_TYPE.ELIMINATION },
                updates,
                {
                  patternCells: [t1, t2, be, le],
                  regionCells: [...new Set([...HOUSES[2][box], ...lineHouse])],
                },
              );
            }
          }
        }
      }
    }
  }
  return null;
}

export const skyscraperTactic: Tactic = {
  id: TACTIC_ID.SKYSCRAPER,
  title: STRATEGY.SKYSCRAPER,
  score: 150,
  rank: 4.0,
  type: STEP_TYPE.ELIMINATION,
  find: findSkyscraper,
};

export const twoStringKiteTactic: Tactic = {
  id: TACTIC_ID.TWO_STRING_KITE,
  title: STRATEGY.TWO_STRING_KITE,
  score: 150,
  rank: 4.0,
  type: STEP_TYPE.ELIMINATION,
  find: findTwoStringKite,
};

export const craneTactic: Tactic = {
  id: TACTIC_ID.CRANE,
  title: STRATEGY.CRANE,
  score: 160,
  rank: 4.1,
  type: STEP_TYPE.ELIMINATION,
  find: findCrane,
};
