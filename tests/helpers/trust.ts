import {
  cloneGrid,
  createEmptyGrid,
  placeValue,
  type GridState,
} from "../../src/board/board";
import { applyStep, findNextStep } from "../../src/tactics/apply";
import { TACTICS } from "../../src/tactics/registry";
import type { Tactic } from "../../src/tactics/types";
import { getUniqueSolution } from "../../src/uniqueness/count-solutions";
import type { Board, SolvingStep } from "../../src/types";

export interface SoundnessFailure {
  tacticId: string;
  index: number;
  eliminated: number;
  solutionDigit: number;
  context: string;
}

/** Every elimination must not remove the true solution digit in that cell. */
export function assertEliminationsSound(
  step: SolvingStep,
  solution: number[],
  tacticId: string,
  context: string,
): SoundnessFailure | null {
  for (const u of step.updates) {
    if (u.eliminatedCandidate == null) continue;
    const truth = solution[u.index];
    if (u.eliminatedCandidate === truth) {
      return {
        tacticId,
        index: u.index,
        eliminated: u.eliminatedCandidate,
        solutionDigit: truth,
        context,
      };
    }
  }
  return null;
}

export function boardFromValues(values: number[]): Board {
  return values.map((v) => (v === 0 ? null : v));
}

/** Place all non-zero values; return null on conflict. */
export function stateFromValues(values: number[]): GridState | null {
  const state = createEmptyGrid();
  for (let i = 0; i < 81; i++) {
    const v = values[i];
    if (!v) continue;
    if (!placeValue(state, i, v)) return null;
  }
  return state;
}

/**
 * Walk from givens, giving `target` first chance each step so earlier tactics
 * do not steal its eliminations. Other registry tactics fill the rest.
 */
export function findAfterBasics(
  initial: GridState,
  target: Tactic,
  maxSteps = 120,
): { step: SolvingStep | null; applied: number } {
  const state = cloneGrid(initial);
  const others = TACTICS.filter((t) => t.id !== target.id);

  for (let i = 0; i < maxSteps; i++) {
    const hit = target.find(state);
    if (hit) return { step: hit, applied: i };

    const next = findNextStep(state, others);
    if (!next) return { step: null, applied: i };
    applyStep(state, next);
  }
  return { step: target.find(state), applied: maxSteps };
}

export function solutionForBoard(board: Board): number[] | null {
  return getUniqueSolution(board);
}
