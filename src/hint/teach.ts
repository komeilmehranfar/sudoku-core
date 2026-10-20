import {
  boardFromPublic,
  cloneGrid,
  isComplete,
  type GridState,
} from "../board/board";
import {
  digitsFromMask,
  hasDigit,
  maskFromDigits,
} from "../board/candidates";
import { CELL_HOUSES, HOUSES, peersOf } from "../board/houses";
import { BOARD_SIZE, CELL_COUNT } from "../board/constants";
import {
  applyStep,
  ELIMINATION_TACTICS,
  findNextStep,
} from "../tactics/apply";
import type { Board, SolvingStep } from "../types";

export type HouseKind = "row" | "column" | "box";

export const TEACH_MODE = {
  open: "open",
  continue: "continue",
} as const;

export type TeachMode = (typeof TEACH_MODE)[keyof typeof TEACH_MODE];

export interface TeachingHint {
  strategy: string;
  /** Display label, e.g. Hidden Single (Box) / Swordfish */
  label: string;
  type: "value" | "elimination" | "add";
  digit: number | null;
  /** Cell where the placement/focus lands */
  focusCell: number | null;
  /** House / pattern cells to ring-highlight */
  regionCells: number[];
  /** Cells that explain why (e.g. kite nodes / same digit peers) */
  relatedCells: number[];
  /** Primary digit for tip copy (first elim / placement); null if none */
  highlightDigit: number | null;
  /** All digits involved in the pattern (e.g. naked pair {2,6}) — green on digitCells */
  patternDigits: number[];
  /** Pattern / causing cells (green candidate glow for patternDigits) */
  digitCells: number[];
  /** Exact eliminations to paint red: cell + digit */
  elimMarks: Array<{ index: number; digit: number }>;
  /** Short explanation for the final tip */
  explanation: string;
  /** Exact engine step (apply on preview continue / to main board) */
  step: SolvingStep;
  /** Snapshot shown in the hint UI (before applying this step) */
  previewBoard: number[];
  previewCandidates: number[][];
}

function houseLabel(kind: HouseKind): string {
  if (kind === "row") return "Row";
  if (kind === "column") return "Column";
  return "Box";
}

function snapshot(state: GridState): {
  previewBoard: number[];
  previewCandidates: number[][];
} {
  return {
    previewBoard: state.values.slice(),
    previewCandidates: state.candidates.map((mask, i) =>
      state.values[i] !== 0 ? [] : digitsFromMask(mask),
    ),
  };
}

function gridFromBoardAndCandidates(
  board: Board,
  candidateLists: number[][],
): GridState {
  const values = Array.from({ length: CELL_COUNT }, (_, i) => {
    const v = board[i];
    return v == null || v === 0 ? 0 : v;
  });
  const candidates = Array.from({ length: CELL_COUNT }, (_, i) => {
    if (values[i] !== 0) return 0;
    const list = candidateLists[i] ?? [];
    return list.length > 0 ? maskFromDigits(list) : 0;
  });
  return { values, candidates };
}

export function stateFromTeachInput(
  board: Board,
  candidateLists?: number[][],
): GridState {
  if (candidateLists) return gridFromBoardAndCandidates(board, candidateLists);
  return boardFromPublic(board);
}

/** Legal candidates from placed digits only. */
export function legalCandidatesFromBoard(board: Board): number[][] {
  const state = boardFromPublic(board);
  return state.candidates.map((mask, i) =>
    state.values[i] !== 0 ? [] : digitsFromMask(mask),
  );
}

/**
 * Hybrid preview seed:
 * - empty notes → full legal
 * - marked notes → player's marks (may be incomplete / illegal)
 */
export function buildPreviewCandidates(
  board: Board,
  notes?: number[][],
): number[][] {
  const legal = legalCandidatesFromBoard(board);
  if (!notes) return legal.map((c) => [...c]);

  return Array.from({ length: CELL_COUNT }, (_, i) => {
    const v = board[i];
    if (v != null && v !== 0) return [];
    const marked = notes[i] ?? [];
    if (marked.length === 0) return [...legal[i]];
    return [...marked];
  });
}

function findHiddenSingleHouse(
  state: GridState,
  cell: number,
  digit: number,
): { kind: HouseKind; cells: number[] } | null {
  const [r, c, b] = CELL_HOUSES[cell];
  const houses: Array<{ kind: HouseKind; cells: readonly number[] }> = [
    { kind: "row", cells: HOUSES[0][r] },
    { kind: "column", cells: HOUSES[1][c] },
    { kind: "box", cells: HOUSES[2][b] },
  ];

  for (const house of houses) {
    const matches: number[] = [];
    for (const idx of house.cells) {
      if (state.values[idx] !== 0) continue;
      if (hasDigit(state.candidates[idx], digit)) matches.push(idx);
    }
    if (matches.length === 1 && matches[0] === cell) {
      return { kind: house.kind, cells: [...house.cells] };
    }
  }
  return null;
}

function relatedDigitCells(state: GridState, cell: number, digit: number): number[] {
  return peersOf(cell).filter((idx) => state.values[idx] === digit);
}

function illegalReason(
  board: Board,
  cell: number,
  digit: number,
): { explanation: string; relatedCells: number[]; regionCells: number[] } {
  const peers = peersOf(cell);
  const blockers = peers.filter((i) => {
    const v = board[i];
    return v != null && v !== 0 && v === digit;
  });
  if (blockers.length > 0) {
    const b = blockers[0];
    const row = Math.floor(b / 9) + 1;
    const col = (b % 9) + 1;
    return {
      explanation: `Candidate ${digit} is impossible here because ${digit} is already placed in a peer cell (row ${row}, column ${col}).`,
      relatedCells: blockers,
      regionCells: [cell, ...blockers],
    };
  }
  return {
    explanation: `Candidate ${digit} is not legal in this cell given the current board.`,
    relatedCells: [],
    regionCells: [cell],
  };
}

function formatDigits(digits: number[]): string {
  if (digits.length === 0) return "";
  if (digits.length === 1) return String(digits[0]);
  if (digits.length === 2) return `${digits[0]} and ${digits[1]}`;
  return `${digits.slice(0, -1).join(", ")}, and ${digits[digits.length - 1]}`;
}

function buildLabel(step: SolvingStep, state: GridState): {
  label: string;
  regionCells: number[];
  relatedCells: number[];
  digit: number | null;
  focusCell: number | null;
  digitCells: number[];
  patternDigits: number[];
  elimMarks: Array<{ index: number; digit: number }>;
  explanation: string;
} {
  const valueUpdate = step.updates.find((u) => u.filledValue != null);
  const elimUpdate = step.updates.find((u) => u.eliminatedCandidate != null);
  const addUpdate = step.updates.find((u) => u.addedCandidate != null);

  if (addUpdate?.addedCandidate != null) {
    const digit = addUpdate.addedCandidate;
    const cell = addUpdate.index;
    return {
      label: "Missing Candidate",
      regionCells: [cell],
      relatedCells: [],
      digit,
      focusCell: cell,
      digitCells: [cell],
      patternDigits: [digit],
      elimMarks: [],
      explanation: `This cell is missing candidate ${digit}. No elimination technique justifies removing it yet, so it should be penciled in.`,
    };
  }

  if (valueUpdate?.filledValue != null) {
    const cell = valueUpdate.index;
    const digit = valueUpdate.filledValue;
    const pattern = step.patternCells ?? [];
    const houses = step.regionCells ?? [];
    const candCount = digitsFromMask(state.candidates[cell]).length;
    const hidden = findHiddenSingleHouse(state, cell, digit);

    if (candCount === 1) {
      return {
        label: "Naked Single",
        regionCells: houses.length > 0 ? houses : [cell],
        relatedCells: pattern.filter((c) => c !== cell),
        digit,
        focusCell: cell,
        digitCells: pattern.length > 0 ? pattern : [cell],
        patternDigits: [digit],
        elimMarks: [],
        explanation: `Only one candidate remains in this cell, so it must be ${digit}.`,
      };
    }

    if (hidden) {
      return {
        label: `Hidden Single (${houseLabel(hidden.kind)})`,
        regionCells: houses.length > 0 ? houses : hidden.cells,
        relatedCells: relatedDigitCells(state, cell, digit),
        digit,
        focusCell: cell,
        digitCells: pattern.length > 0 ? pattern : [cell],
        patternDigits: [digit],
        elimMarks: [],
        explanation: `The candidate ${digit} has been ruled out from all other cells within the marked region. Therefore, we know for sure that it is that cell's solution.`,
      };
    }

    return {
      label: step.strategy.replace(/ Strategy$/, ""),
      regionCells: houses.length > 0 ? houses : [cell],
      relatedCells:
        pattern.length > 0
          ? pattern.filter((c) => c !== cell)
          : relatedDigitCells(state, cell, digit),
      digit,
      focusCell: cell,
      digitCells: pattern.length > 0 ? pattern : [cell],
      patternDigits: [digit],
      elimMarks: [],
      explanation: `Place ${digit} using ${step.strategy.replace(/ Strategy$/, "")}.`,
    };
  }

  if (elimUpdate?.eliminatedCandidate != null) {
    const elimMarks = step.updates
      .filter((u) => u.eliminatedCandidate != null)
      .map((u) => ({
        index: u.index,
        digit: u.eliminatedCandidate as number,
      }));
    const elimDigits = [...new Set(elimMarks.map((m) => m.digit))].sort(
      (a, b) => a - b,
    );
    const elimCells = [...new Set(elimMarks.map((m) => m.index))];
    const digit = elimDigits[0] ?? null;
    const digitList = formatDigits(elimDigits);
    const pattern = step.patternCells ?? [];
    const houses = step.regionCells ?? [];
    const patternDigits = (
      step.patternDigits?.length
        ? step.patternDigits
        : elimDigits.length > 0
          ? elimDigits
          : digit != null
            ? [digit]
            : []
    )
      .slice()
      .sort((a, b) => a - b);

    if (step.strategy === "Impossible Candidate") {
      return {
        label: "Impossible Candidate",
        regionCells: elimCells,
        relatedCells: [],
        digit,
        focusCell: elimCells[0] ?? null,
        digitCells: [],
        patternDigits: [],
        elimMarks,
        explanation: step.strategy,
      };
    }

    if (pattern.length > 0) {
      const name = step.strategy.replace(/ Strategy$/, "");
      return {
        label: name,
        regionCells: houses.length > 0 ? houses : pattern,
        relatedCells: pattern,
        digit,
        focusCell: elimCells[0] ?? null,
        digitCells: pattern,
        patternDigits,
        elimMarks,
        explanation:
          name === "Two-String-Kite"
            ? `Candidate ${digitList} forms a conjugate pair in a row and in a column that meet in the same box (the kite). At least one free end is true, so ${digitList} can be eliminated from cells that see both free ends.`
            : name === "Pointing Elimination"
              ? `In the marked box, candidate ${digitList} only appears in one line. That forces ${digitList} into that line inside the box, so ${digitList} can be removed from the rest of the line (red).`
              : name === "Naked Pair" ||
                  name === "Naked Triplet" ||
                  name === "Naked Quadruple" ||
                  name === "Hidden Pair" ||
                  name.startsWith("Hidden")
                ? `These cells form a ${name.toLowerCase()} on ${digitList}. Those digits are locked there, so remove ${digitList} from the other cells in the house (red).`
                : `Eliminate candidate ${digitList} from the red cell(s) using ${name}. Green marks show the pattern that forces the removal.`,
      };
    }

    return {
      label: step.strategy.replace(/ Strategy$/, ""),
      regionCells: houses.length > 0 ? houses : elimCells,
      relatedCells: pattern,
      digit,
      focusCell: elimCells[0] ?? null,
      digitCells: pattern,
      patternDigits,
      elimMarks,
      explanation: `Eliminate candidate ${digitList} from the red cell(s) using ${step.strategy.replace(/ Strategy$/, "")}.`,
    };
  }

  return {
    label: step.strategy,
    regionCells: [],
    relatedCells: [],
    digit: null,
    focusCell: null,
    digitCells: [],
    patternDigits: [],
    elimMarks: [],
    explanation: step.strategy,
  };
}

function toTeachingHint(
  step: SolvingStep,
  state: GridState,
  overrides?: Partial<
    Pick<
      TeachingHint,
      | "explanation"
      | "relatedCells"
      | "regionCells"
      | "label"
      | "digitCells"
      | "patternDigits"
      | "elimMarks"
    >
  >,
): TeachingHint {
  const meta = buildLabel(step, state);
  const snap = snapshot(state);
  return {
    strategy: step.strategy,
    label: overrides?.label ?? meta.label,
    type: step.type,
    digit: meta.digit,
    focusCell: meta.focusCell,
    regionCells: overrides?.regionCells ?? meta.regionCells,
    relatedCells: overrides?.relatedCells ?? meta.relatedCells,
    highlightDigit: meta.digit,
    patternDigits: overrides?.patternDigits ?? meta.patternDigits,
    digitCells: overrides?.digitCells ?? meta.digitCells,
    elimMarks: overrides?.elimMarks ?? meta.elimMarks,
    explanation: overrides?.explanation ?? meta.explanation,
    step,
    previewBoard: snap.previewBoard,
    previewCandidates: snap.previewCandidates,
  };
}

function findIllegalHint(
  board: Board,
  notes: number[][],
  legal: number[][],
  preview: number[][],
): TeachingHint | null {
  for (let i = 0; i < CELL_COUNT; i++) {
    const v = board[i];
    if (v != null && v !== 0) continue;
    const marked = notes[i] ?? [];
    if (marked.length === 0) continue;
    const legalSet = new Set(legal[i]);
    for (const d of marked) {
      if (legalSet.has(d)) continue;
      const reason = illegalReason(board, i, d);
      const step: SolvingStep = {
        strategy: "Impossible Candidate",
        type: "elimination",
        updates: [{ index: i, eliminatedCandidate: d }],
      };
      const state = gridFromBoardAndCandidates(board, preview);
      return toTeachingHint(step, state, {
        label: "Impossible Candidate",
        explanation: reason.explanation,
        relatedCells: reason.relatedCells,
        regionCells: reason.regionCells,
      });
    }
  }
  return null;
}

/** Earliest elim tactic whose step removes `digit` from `cell`. */
function findJustifyingElimination(
  state: GridState,
  cell: number,
  digit: number,
): SolvingStep | null {
  for (const tactic of ELIMINATION_TACTICS) {
    const found = tactic.find(state);
    if (
      found?.updates.some(
        (u) => u.index === cell && u.eliminatedCandidate === digit,
      )
    ) {
      return found;
    }
  }
  return null;
}

/**
 * Missing candidates on marked cells:
 * - Justified by an elim tactic → accept the absence (player already eliminated);
 *   do NOT re-teach that elim (would restore the digit and loop after Apply).
 * - Unjustified → teach adding the candidate.
 */
function findUnjustifiedMissingAdd(
  board: Board,
  notes: number[][],
  legal: number[][],
  preview: number[][],
): TeachingHint | null {
  for (let i = 0; i < CELL_COUNT; i++) {
    const v = board[i];
    if (v != null && v !== 0) continue;
    const marked = notes[i] ?? [];
    if (marked.length === 0) continue;

    const markedSet = new Set(marked);
    for (const d of legal[i]) {
      if (markedSet.has(d)) continue;

      const probeLists = preview.map((c, idx) =>
        idx === i ? Array.from(new Set([...c, d])) : [...c],
      );
      const probeState = gridFromBoardAndCandidates(board, probeLists);
      const elim = findJustifyingElimination(probeState, i, d);
      // Absence is valid — keep notes as-is and keep scanning
      if (elim) continue;

      const showLists = preview.map((c, idx) =>
        idx === i ? Array.from(new Set([...c, d])) : [...c],
      );
      const state = gridFromBoardAndCandidates(board, showLists);
      const step: SolvingStep = {
        strategy: "Missing Candidate",
        type: "add",
        updates: [{ index: i, addedCandidate: d }],
      };
      return toTeachingHint(step, state);
    }
  }

  return null;
}

/**
 * Next teaching hint — first useful step only (reconcile / elim / value).
 * `notes`: player pencil marks (open mode). Empty cells filled with legal.
 * `mode: "continue"` skips reconcile and uses candidateLists as the working grid.
 */
export function teachHint(
  board: Board,
  notesOrCandidates?: number[][],
  mode: TeachMode = TEACH_MODE.open,
): TeachingHint | null {
  try {
    if (isComplete(stateFromTeachInput(board))) return null;

    if (mode === TEACH_MODE.continue) {
      const state = stateFromTeachInput(board, notesOrCandidates);
      if (isComplete(state)) return null;
      const found = findNextStep(state);
      if (!found) return null;
      return toTeachingHint(found, state);
    }

    const legal = legalCandidatesFromBoard(board);
    const notes = notesOrCandidates ?? Array.from({ length: CELL_COUNT }, () => []);
    const preview = buildPreviewCandidates(board, notes);

    const illegal = findIllegalHint(board, notes, legal, preview);
    if (illegal) return illegal;

    const missing = findUnjustifiedMissingAdd(board, notes, legal, preview);
    if (missing) return missing;

    const state = gridFromBoardAndCandidates(board, preview);
    if (isComplete(state)) return null;
    const found = findNextStep(state);
    if (!found) return null;
    return toTeachingHint(found, state);
  } catch {
    return null;
  }
}

/** Apply a teaching step onto a preview snapshot (for "Continue"). */
export function applyTeachStep(
  board: Board,
  candidateLists: number[][],
  step: SolvingStep,
): { board: number[]; candidates: number[][] } | null {
  try {
    const state = cloneGrid(stateFromTeachInput(board, candidateLists));
    applyStep(state, step);
    const snap = snapshot(state);
    return { board: snap.previewBoard, candidates: snap.previewCandidates };
  } catch {
    return null;
  }
}

export function candidatesFromBoard(board: Board): number[][] {
  try {
    return legalCandidatesFromBoard(board);
  } catch {
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => []);
  }
}
