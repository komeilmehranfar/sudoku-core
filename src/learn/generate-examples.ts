import {
  boardFromPublic,
  clearValue,
  cloneGrid,
  createEmptyGrid,
  placeValue,
  type GridState,
} from "../board/board";
import { digitsFromMask } from "../board/candidates";
import { CELL_COUNT, DIFFICULTIES } from "../board/constants";
import { generatePuzzle } from "../generate/generate";
import { applyStep, findNextStep, walkthrough } from "../tactics/apply";
import { tacticByTitle } from "../tactics/registry";
import { isUniqueSolution } from "../uniqueness/count-solutions";
import type { Board, Difficulty, SolvingStep, Update } from "../types";

export interface LearnExample {
  /** 81 values; 0 = empty (mid-solve position, before the tactic step) */
  board: number[];
  /** Candidates per cell at that position */
  candidates: number[][];
  step: {
    strategy: string;
    type: SolvingStep["type"];
    updates: Update[];
    patternCells?: number[];
    patternDigits?: number[];
    regionCells?: number[];
  };
  caption: string;
}

export interface LearnLessonTarget {
  id: string;
  strategy: string;
}

/**
 * All illustrated learn targets — order matches engine TACTICS difficulty.
 * Must stay in sync with LEARN_LESSONS in lib/learn/lessons.ts.
 */
export const LEARN_TARGETS: LearnLessonTarget[] = [
  { id: "open-singles", strategy: "Open Singles Strategy" },
  { id: "naked-single", strategy: "Visual Elimination Strategy" },
  { id: "hidden-single", strategy: "Single Candidate Strategy" },
  { id: "naked-pair", strategy: "Naked Pair Strategy" },
  { id: "pointing", strategy: "Pointing Elimination Strategy" },
  { id: "hidden-pair", strategy: "Hidden Pair Strategy" },
  { id: "hidden-groups", strategy: "Hidden Groups Strategy" },
  { id: "x-wing", strategy: "X-Wing Strategy" },
  { id: "skyscraper", strategy: "Skyscraper Strategy" },
  { id: "two-string-kite", strategy: "Two-String-Kite Strategy" },
  { id: "crane", strategy: "Crane Strategy" },
  { id: "swordfish", strategy: "Swordfish Strategy" },
  { id: "y-wing", strategy: "Y-Wing Strategy" },
  { id: "xyz-wing", strategy: "XYZ-Wing Strategy" },
  { id: "w-wing", strategy: "W-Wing Strategy" },
  { id: "empty-rectangle", strategy: "Empty Rectangle Strategy" },
  { id: "unique-rectangle", strategy: "Unique Rectangle Strategy" },
  { id: "simple-colouring", strategy: "Simple Colouring Strategy" },
  { id: "finned-x-wing", strategy: "Finned X-Wing Strategy" },
  { id: "wxyz-wing", strategy: "WXYZ-Wing Strategy" },
  { id: "finned-swordfish", strategy: "Finned Swordfish Strategy" },
  { id: "jellyfish", strategy: "Jellyfish Strategy" },
  { id: "bug-plus-one", strategy: "BUG+1 Strategy" },
  { id: "finned-jellyfish", strategy: "Finned Jellyfish Strategy" },
  { id: "x-chain", strategy: "X-Chain Strategy" },
  { id: "xy-chain", strategy: "XY-Chain Strategy" },
  { id: "medusa", strategy: "3D-Medusa Strategy" },
  { id: "aic", strategy: "AIC Strategy" },
  { id: "nishio", strategy: "Nishio Forcing Chain Strategy" },
];

/** @deprecated use LEARN_TARGETS */
export const BASIC_LEARN_TARGETS = LEARN_TARGETS;

type RandomFn = () => number;

function mulberry32(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fillCompleteGrid(random: RandomFn): GridState {
  const state = createEmptyGrid();

  function solve(index: number): boolean {
    if (index >= CELL_COUNT) return true;
    if (state.values[index] !== 0) return solve(index + 1);
    const digits = shuffle(digitsFromMask(state.candidates[index]), random);
    for (const digit of digits) {
      const snapshot = cloneGrid(state);
      if (!placeValue(state, index, digit)) {
        Object.assign(state, snapshot);
        continue;
      }
      if (solve(index + 1)) return true;
      state.values = snapshot.values;
      state.candidates = snapshot.candidates;
    }
    return false;
  }

  if (!solve(0)) throw new Error("Failed to fill a complete grid");
  return state;
}

/**
 * Fast unique human-solvable puzzle — difficulty band does not matter.
 * Digs clues until unique + walkthrough solves.
 */
export function generateAnySolvablePuzzle(
  seed: number,
  options?: { clueTarget?: number; timeoutMs?: number },
): Board {
  const random = mulberry32(seed);
  const clueTarget = options?.clueTarget ?? 24 + Math.floor(random() * 16);
  const timeoutMs = options?.timeoutMs ?? 4_000;
  const started = Date.now();
  const filled = fillCompleteGrid(random);
  const order = shuffle([...Array(CELL_COUNT).keys()], random);
  let lastValid: Board | null = null;
  let removals = CELL_COUNT - clueTarget;

  for (const cellIndex of order) {
    if (removals <= 0) break;
    if (Date.now() - started > timeoutMs) break;
    const digit = filled.values[cellIndex];
    if (digit === 0) continue;
    clearValue(filled, cellIndex);
    const board = filled.values.map((v) => (v === 0 ? null : v)) as Board;
    if (!isUniqueSolution(board)) {
      placeValue(filled, cellIndex, digit);
      continue;
    }
    const path = walkthrough(filled);
    if (!path.solved) {
      placeValue(filled, cellIndex, digit);
      continue;
    }
    removals--;
    lastValid = board;
  }

  const puzzle = filled.values.map((v) => (v === 0 ? null : v)) as Board;
  const path = walkthrough(filled);
  if (path.solved && isUniqueSolution(puzzle)) return puzzle;
  if (lastValid) return lastValid;

  // Fallback: rated generator at any difficulty
  const difficulty =
    DIFFICULTIES[seed % DIFFICULTIES.length] ?? ("L5" as Difficulty);
  return generatePuzzle({
    difficulty,
    seed,
    timeoutMs: 8_000,
    maxAttempts: 15,
  });
}

function boardKey(values: number[]): string {
  return values.join("");
}

function snapshotCandidates(state: GridState): number[][] {
  return state.candidates.map((mask, i) =>
    state.values[i] !== 0 ? [] : digitsFromMask(mask),
  );
}

function buildCaption(step: SolvingStep): string {
  const name = step.strategy.replace(/ Strategy$/, "");
  const fills = step.updates.filter((u) => u.filledValue != null);
  const elims = step.updates.filter((u) => u.eliminatedCandidate != null);

  if (fills.length > 0) {
    const digit = fills[0].filledValue!;
    return `${name}: place ${digit}`;
  }

  if (elims.length > 0) {
    const digits = [
      ...new Set(elims.map((u) => u.eliminatedCandidate!)),
    ].sort((a, b) => a - b);
    const label =
      digits.length === 1
        ? String(digits[0])
        : digits.length === 2
          ? `${digits[0]} and ${digits[1]}`
          : digits.join(", ");
    const cells = new Set(elims.map((u) => u.index)).size;
    return `${name}: remove ${label} from ${cells} cell${cells === 1 ? "" : "s"}`;
  }

  return name;
}

function toPublicBoard(values: number[]): Board {
  return values.map((v) => (v === 0 ? null : v));
}

function exampleFromStep(state: GridState, next: SolvingStep): LearnExample {
  return {
    board: state.values.slice(),
    candidates: snapshotCandidates(state),
    step: {
      strategy: next.strategy,
      type: next.type,
      updates: next.updates.map((u) => ({ ...u })),
      ...(next.patternCells?.length
        ? { patternCells: [...next.patternCells] }
        : {}),
      ...(next.patternDigits?.length
        ? { patternDigits: [...next.patternDigits] }
        : {}),
      ...(next.regionCells?.length
        ? { regionCells: [...next.regionCells] }
        : {}),
    },
    caption: buildCaption(next),
  };
}

/**
 * Walk the full human solve path and keep the first mid-solve snapshot
 * for every strategy that appears as the preferred next step.
 *
 * `showcaseStrategies`: also snapshot when that tactic *applies* on the
 * board even if an easier move is preferred — needed for rare techniques
 * that almost never become the engine's next step.
 */
export function mineExamplesFromPuzzle(
  puzzle: Board,
  showcaseStrategies?: ReadonlySet<string>,
): Map<string, LearnExample> {
  const out = new Map<string, LearnExample>();
  const state = boardFromPublic(puzzle);
  const seen = new Set<string>();

  for (let guard = 0; guard < 500; guard++) {
    const key = boardKey(state.values);
    if (seen.has(key)) break;
    seen.add(key);

    const next = findNextStep(state);
    if (!next) break;

    if (!out.has(next.strategy)) {
      out.set(next.strategy, exampleFromStep(state, next));
    }

    // Showcase only on elim steps (skips cheap early singles spam) and
    // only for strategies we still need.
    if (showcaseStrategies?.size && next.type === "elimination") {
      for (const strategy of showcaseStrategies) {
        if (out.has(strategy)) continue;
        const tactic = tacticByTitle(strategy);
        if (!tactic) continue;
        const hit = tactic.find(state);
        if (hit) out.set(strategy, exampleFromStep(state, hit));
      }
    }

    applyStep(state, next);
  }

  return out;
}

/**
 * Solve until the *next* step is exactly `strategy`.
 * Returns null if this puzzle never needs that tactic.
 */
export function findExampleForStrategy(
  puzzle: Board,
  strategy: string,
): LearnExample | null {
  return mineExamplesFromPuzzle(puzzle).get(strategy) ?? null;
}

export interface GenerateLessonExamplesOptions {
  count?: number;
  maxAttempts?: number;
  seedBase?: number;
  onProgress?: (message: string) => void;
}

type HuntTier = "common" | "mid" | "rare" | "ultra";

const HUNT_TIER: Record<string, HuntTier> = {
  "open-singles": "common",
  "naked-single": "common",
  "hidden-single": "common",
  "naked-pair": "common",
  pointing: "common",
  "hidden-pair": "mid",
  "hidden-groups": "rare",
  "x-wing": "mid",
  skyscraper: "mid",
  "two-string-kite": "mid",
  crane: "rare",
  swordfish: "rare",
  "y-wing": "mid",
  "xyz-wing": "rare",
  "w-wing": "rare",
  "empty-rectangle": "rare",
  "unique-rectangle": "rare",
  "simple-colouring": "rare",
  "finned-x-wing": "rare",
  "wxyz-wing": "ultra",
  "finned-swordfish": "ultra",
  jellyfish: "ultra",
  "bug-plus-one": "ultra",
  "finned-jellyfish": "ultra",
  "x-chain": "rare",
  "xy-chain": "rare",
  medusa: "ultra",
  aic: "ultra",
  nishio: "ultra",
};

const TIER_ATTEMPTS: Record<HuntTier, number> = {
  common: 200,
  mid: 1200,
  rare: 5000,
  ultra: 8000,
};

const HARD_DIFFS: Difficulty[] = ["L6", "L7", "L8", "L9", "L10"];
const ULTRA_DIFFS: Difficulty[] = ["L8", "L9", "L10"];

function strategyToLessonId(): Map<string, string> {
  return new Map(LEARN_TARGETS.map((t) => [t.strategy, t.id]));
}

function makePuzzle(seed: number, attempt: number, preferHard: boolean): Board {
  // Mix fast digger puzzles with rated hard ones — digger finds more
  // mid-solve variety per wall-clock second.
  if (!preferHard || attempt % 3 !== 0) {
    const clueTarget = 18 + (attempt % 16);
    return generateAnySolvablePuzzle(seed, {
      clueTarget,
      timeoutMs: preferHard ? 3_000 : 4_000,
    });
  }
  const diffs = attempt % 5 === 0 ? ULTRA_DIFFS : HARD_DIFFS;
  const difficulty = diffs[attempt % diffs.length]!;
  return generatePuzzle({
    difficulty,
    seed,
    timeoutMs: 5_000,
    maxAttempts: 10,
  });
}

/**
 * Collect up to `count` distinct illustrated examples for one tactic.
 */
export function generateExamplesForTactic(
  target: LearnLessonTarget,
  options: GenerateLessonExamplesOptions = {},
): LearnExample[] {
  const tier = HUNT_TIER[target.id] ?? "rare";
  const {
    count = 3,
    maxAttempts = TIER_ATTEMPTS[tier],
    seedBase = 1,
    onProgress,
  } = options;

  const preferHard = tier !== "common";
  const found: LearnExample[] = [];
  const keys = new Set<string>();

  for (
    let attempt = 0;
    attempt < maxAttempts && found.length < count;
    attempt++
  ) {
    const seed = (seedBase * 100_003 + attempt * 9973) >>> 0;

    let puzzle: Board;
    try {
      puzzle = makePuzzle(seed, attempt, preferHard);
    } catch {
      if (attempt % 50 === 0) {
        onProgress?.(
          `${target.id}: generate failed (attempt ${attempt + 1}, seed ${seed})`,
        );
      }
      continue;
    }

    const example = findExampleForStrategy(puzzle, target.strategy);
    if (!example) {
      if (preferHard && attempt % 100 === 0) {
        onProgress?.(
          `${target.id}: still searching… attempt ${attempt + 1}/${maxAttempts}`,
        );
      }
      continue;
    }

    const key = boardKey(example.board);
    if (keys.has(key)) continue;
    keys.add(key);
    found.push(example);
    onProgress?.(
      `${target.id}: found ${found.length}/${count} (attempt ${attempt + 1}, seed ${seed})`,
    );
  }

  return found;
}

export interface FillMissingOptions {
  perLesson?: number;
  maxAttempts?: number;
  seedBase?: number;
  onProgress?: (message: string) => void;
  /** Called whenever examples change — use to checkpoint JSON. */
  onUpdate?: (lessons: Record<string, LearnExample[]>) => void;
  /** Existing examples to keep / top up */
  existing?: Record<string, LearnExample[]>;
}

/**
 * Fill every incomplete lesson by mining *all* strategies from each puzzle.
 * Much faster than hunting tactics one-by-one when many are missing.
 */
export function fillMissingLearnExamples(
  options: FillMissingOptions = {},
): Record<string, LearnExample[]> {
  const {
    perLesson = 3,
    maxAttempts = 12_000,
    seedBase = Date.now() % 100_000,
    onProgress,
    onUpdate,
    existing = {},
  } = options;

  const lessons: Record<string, LearnExample[]> = {};
  const keys: Record<string, Set<string>> = {};
  for (const target of LEARN_TARGETS) {
    const list = [...(existing[target.id] ?? [])].slice(0, perLesson);
    lessons[target.id] = list;
    keys[target.id] = new Set(list.map((e) => boardKey(e.board)));
  }

  const byStrategy = strategyToLessonId();

  function incomplete(): LearnLessonTarget[] {
    return LEARN_TARGETS.filter(
      (t) => (lessons[t.id]?.length ?? 0) < perLesson,
    );
  }

  let left = incomplete();
  if (left.length === 0) {
    onProgress?.("All lessons already have enough examples.");
    return lessons;
  }

  onProgress?.(
    `Filling ${left.length} incomplete lessons (need ${perLesson} each)…`,
  );

  for (let attempt = 0; attempt < maxAttempts && left.length > 0; attempt++) {
    const seed = (seedBase * 100_003 + attempt * 9973) >>> 0;
    let puzzle: Board;
    try {
      puzzle = makePuzzle(seed, attempt, true);
    } catch {
      continue;
    }

    // Prefer natural next-step hits; also showcase-hunt still-missing rares
    const needShowcase = new Set(
      left.filter((t) => (HUNT_TIER[t.id] ?? "rare") !== "common").map(
        (t) => t.strategy,
      ),
    );
    const mined = mineExamplesFromPuzzle(puzzle, needShowcase);
    let added = 0;
    for (const [strategy, example] of mined) {
      const id = byStrategy.get(strategy);
      if (!id) continue;
      const list = lessons[id]!;
      if (list.length >= perLesson) continue;
      const key = boardKey(example.board);
      if (keys[id]!.has(key)) continue;
      keys[id]!.add(key);
      list.push(example);
      added++;
      onProgress?.(
        `${id}: ${list.length}/${perLesson} (attempt ${attempt + 1})`,
      );
    }

    if (added > 0) {
      left = incomplete();
      onUpdate?.(lessons);
    } else if (attempt % 200 === 0) {
      onProgress?.(
        `… attempt ${attempt + 1}/${maxAttempts}, still need: ${left.map((t) => t.id).join(", ")}`,
      );
    }
  }

  onUpdate?.(lessons);
  return lessons;
}

export function generateAllLearnExamples(
  options: GenerateLessonExamplesOptions = {},
): Record<string, LearnExample[]> {
  return fillMissingLearnExamples({
    perLesson: options.count ?? 3,
    maxAttempts: options.maxAttempts ?? 12_000,
    seedBase: options.seedBase,
    onProgress: options.onProgress,
  });
}

/** @deprecated use generateAllLearnExamples */
export const generateAllBasicExamples = generateAllLearnExamples;

/**
 * Re-verify: preferred next step is the strategy, or (for showcase rares)
 * the tactic still applies on this board.
 */
export function verifyExample(
  example: LearnExample,
  strategy: string,
): boolean {
  const board = toPublicBoard(example.board);
  if (board.length !== CELL_COUNT) return false;
  const state = cloneGrid(boardFromPublic(board));
  const next = findNextStep(state);
  if (next?.strategy === strategy) return true;
  const hit = tacticByTitle(strategy)?.find(state);
  return hit?.strategy === strategy;
}
