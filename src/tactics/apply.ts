import {
  addCandidate,
  cloneGrid,
  eliminateCandidate,
  isComplete,
  placeValue,
  type GridState,
} from "../board/board";
import type { SolvingStep } from "../types";
import { TACTICS } from "./registry";
import type { Tactic } from "./types";
import { STEP_TYPE } from "../board/constants";

export function applyStep(state: GridState, found: SolvingStep): void {
  for (const update of found.updates) {
    if (update.filledValue != null) {
      placeValue(state, update.index, update.filledValue);
    } else if (update.eliminatedCandidate != null) {
      eliminateCandidate(state, update.index, update.eliminatedCandidate);
    } else if (update.addedCandidate != null) {
      addCandidate(state, update.index, update.addedCandidate);
    }
  }
}

export function findNextStep(
  state: GridState,
  tactics: readonly Tactic[] = TACTICS,
): SolvingStep | null {
  for (const tactic of tactics) {
    const found = tactic.find(state);
    if (found) return found;
  }
  return null;
}

/** Elimination tactics only — used when probing whether a missing mark is justified. */
export const ELIMINATION_TACTICS: readonly Tactic[] = TACTICS.filter(
  (t) => t.type === STEP_TYPE.ELIMINATION,
);

export function findNextElimination(state: GridState): SolvingStep | null {
  return findNextStep(state, ELIMINATION_TACTICS);
}

export interface WalkthroughResult {
  solved: boolean;
  steps: SolvingStep[];
  state: GridState;
  stuck: boolean;
}

export function walkthrough(
  initial: GridState,
  tactics: readonly Tactic[] = TACTICS,
  maxSteps = 500,
): WalkthroughResult {
  const state = cloneGrid(initial);
  const steps: SolvingStep[] = [];

  for (let i = 0; i < maxSteps; i++) {
    if (isComplete(state)) {
      return { solved: true, steps, state, stuck: false };
    }
    const found = findNextStep(state, tactics);
    if (!found) {
      return { solved: false, steps, state, stuck: true };
    }
    applyStep(state, found);
    steps.push(found);
  }

  return {
    solved: isComplete(state),
    steps,
    state,
    stuck: !isComplete(state),
  };
}
