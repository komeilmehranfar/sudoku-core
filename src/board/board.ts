import { CELL_COUNT, FULL_CANDIDATES } from "./constants";
import {
  CandidateMask,
  addDigit,
  fullCandidates,
  removeDigit,
} from "./candidates";
import { peersOf } from "./houses";
import type { Board } from "../types";

export interface GridState {
  /** 0 = empty, 1-9 = filled */
  values: number[];
  /** Bitmask of candidates per cell; 0 when filled */
  candidates: CandidateMask[];
}

export function createEmptyGrid(): GridState {
  return {
    values: Array(CELL_COUNT).fill(0),
    candidates: Array(CELL_COUNT).fill(FULL_CANDIDATES),
  };
}

export function cloneGrid(state: GridState): GridState {
  return {
    values: state.values.slice(),
    candidates: state.candidates.slice(),
  };
}

export function boardFromPublic(board: Board): GridState {
  if (board.length !== CELL_COUNT) {
    throw new Error(`Board must have ${CELL_COUNT} cells, got ${board.length}`);
  }

  const state = createEmptyGrid();
  for (let i = 0; i < CELL_COUNT; i++) {
    const value = board[i];
    if (value == null) continue;
    if (!Number.isInteger(value) || value < 1 || value > 9) {
      const fix = value === 0 ? " (use null for empty cells)" : "";
      throw new Error(
        `Invalid cell value at ${i}: ${JSON.stringify(
          value,
        )}, expected 1–9 or null${fix}`,
      );
    }
    if (!placeValue(state, i, value)) {
      throw new Error(`Conflicting value ${value} at index ${i}`);
    }
  }
  return state;
}

export function boardToPublic(state: GridState): Board {
  return state.values.map((v) => (v === 0 ? null : v));
}

/** Place a digit, eliminate from peers. Returns false if illegal. */
export function placeValue(
  state: GridState,
  index: number,
  digit: number,
): boolean {
  if (state.values[index] === digit) return true;
  if (state.values[index] !== 0) return false;

  for (const peer of peersOf(index)) {
    if (state.values[peer] === digit) return false;
  }

  state.values[index] = digit;
  state.candidates[index] = 0;

  for (const peer of peersOf(index)) {
    if (state.values[peer] !== 0) continue;
    state.candidates[peer] = removeDigit(state.candidates[peer], digit);
  }
  return true;
}

export function clearValue(state: GridState, index: number): void {
  const digit = state.values[index];
  if (digit === 0) return;
  state.values[index] = 0;
  rebuildCandidates(state);
}

export function rebuildCandidates(state: GridState): void {
  state.candidates = state.values.map((v) => (v === 0 ? fullCandidates() : 0));
  for (let i = 0; i < CELL_COUNT; i++) {
    const digit = state.values[i];
    if (digit === 0) continue;
    for (const peer of peersOf(i)) {
      if (state.values[peer] !== 0) continue;
      state.candidates[peer] = removeDigit(state.candidates[peer], digit);
    }
  }
}

export function isComplete(state: GridState): boolean {
  return state.values.every((v) => v !== 0);
}

export function eliminateCandidate(
  state: GridState,
  index: number,
  digit: number,
): boolean {
  if (state.values[index] !== 0) return false;
  const before = state.candidates[index];
  const after = removeDigit(before, digit);
  if (before === after) return false;
  state.candidates[index] = after;
  return true;
}

export function addCandidate(
  state: GridState,
  index: number,
  digit: number,
): boolean {
  if (state.values[index] !== 0) return false;
  const before = state.candidates[index];
  const after = addDigit(before, digit);
  if (before === after) return false;
  state.candidates[index] = after;
  return true;
}
