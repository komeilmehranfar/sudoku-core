import { CELL_COUNT } from "../board/constants";
import { digitsFromMask, hasDigit } from "../board/candidates";
import { HOUSES } from "../board/houses";
import { cloneGrid, placeValue, type GridState } from "../board/board";
import { openSinglesTactic } from "./open-singles";
import { nakedSingleTactic } from "./naked-single";
import { hiddenSingleTactic } from "./hidden-single";
import { regionFromCells, step, type Tactic } from "./types";

/**
 * Nishio Forcing Chain/Net: assume a candidate is true; if singles
 * propagation reaches a contradiction, that candidate is false.
 *
 * This is a trial-and-error pattern rated ~7.8–8.1 on common difficulty
 * scales — last resort after AIC / Medusa, but fully human-logic (no guessing
 * the solution).
 */
export const nishioTactic: Tactic = {
  id: "nishio",
  title: "Nishio Forcing Chain Strategy",
  score: 400,
  rank: 7.9,
  type: "elimination",
  find(state: GridState) {
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.values[i] !== 0) continue;
      const digits = digitsFromMask(state.candidates[i]);
      // Prefer denser cells last; try low digit counts first (faster contradictions)
      if (digits.length < 2) continue;

      for (const digit of digits) {
        if (assumptionContradicts(state, i, digit)) {
          return step(
            { title: "Nishio Forcing Chain Strategy", type: "elimination" },
            [{ index: i, eliminatedCandidate: digit }],
            {
              patternCells: [i],
              regionCells: regionFromCells([i]),
            },
          );
        }
      }
    }
    return null;
  },
};

function assumptionContradicts(
  state: GridState,
  index: number,
  digit: number,
): boolean {
  const trial = cloneGrid(state);
  if (!placeValue(trial, index, digit)) return true;
  if (!propagateSingles(trial)) return true;
  return hasContradiction(trial);
}

/** Fill forced singles; return false if a placement becomes illegal. */
function propagateSingles(state: GridState): boolean {
  for (let guard = 0; guard < 200; guard++) {
    const next =
      openSinglesTactic.find(state) ??
      nakedSingleTactic.find(state) ??
      hiddenSingleTactic.find(state);
    if (!next) return true;
    for (const u of next.updates) {
      if (u.filledValue == null) continue;
      if (!placeValue(state, u.index, u.filledValue)) return false;
    }
  }
  return true;
}

function hasContradiction(state: GridState): boolean {
  for (let i = 0; i < CELL_COUNT; i++) {
    if (state.values[i] !== 0) continue;
    if (state.candidates[i] === 0) return true;
  }

  for (const group of HOUSES) {
    for (const house of group) {
      const present = new Set<number>();
      for (const idx of house) {
        if (state.values[idx] !== 0) present.add(state.values[idx]);
      }
      for (let d = 1; d <= 9; d++) {
        if (present.has(d)) continue;
        let canPlace = false;
        for (const idx of house) {
          if (state.values[idx] !== 0) continue;
          if (hasDigit(state.candidates[idx], d)) {
            canPlace = true;
            break;
          }
        }
        if (!canPlace) return true;
      }
    }
  }
  return false;
}
