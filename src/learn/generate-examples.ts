import {
  boardFromPublic,
  clearValue,
  cloneGrid,
  createEmptyGrid,
  placeValue,
  type GridState,
} from "../board/board";
import { digitsFromMask } from "../board/candidates";
import {
  CELL_COUNT,
  DIFFICULTIES,
  DIFFICULTY_L5,
  DIFFICULTY_L6,
  DIFFICULTY_L7,
  DIFFICULTY_L8,
  DIFFICULTY_L9,
  DIFFICULTY_L10,
  STEP_TYPE,
} from "../board/constants";
import { generatePuzzle } from "../generate/generate";
import { applyStep, findNextStep, walkthrough } from "../tactics/apply";
import { tacticByTitle } from "../tactics/registry";
import { isUniqueSolution } from "../uniqueness/count-solutions";
import type { Board, Difficulty, SolvingStep, Update } from "../types";
import {
  STRATEGY,
  TACTIC_ID,
  techniqueName,
  type Strategy,
} from "../tactics/names";

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
  strategy: Strategy;
}

/** Lesson slugs that differ from the tactic id they teach. */
const LESSON_ID = {
  POINTING: "pointing",
  MEDUSA: "medusa",
} as const;

/**
 * All illustrated learn targets — order matches engine TACTICS difficulty.
 * Must stay in sync with LEARN_LESSONS in lib/learn/lessons.ts.
 */
export const LEARN_TARGETS: LearnLessonTarget[] = [
  { id: TACTIC_ID.OPEN_SINGLES, strategy: STRATEGY.OPEN_SINGLES },
  { id: TACTIC_ID.NAKED_SINGLE, strategy: STRATEGY.NAKED_SINGLE },
  { id: TACTIC_ID.HIDDEN_SINGLE, strategy: STRATEGY.HIDDEN_SINGLE },
  { id: TACTIC_ID.NAKED_PAIR, strategy: STRATEGY.NAKED_PAIR },
  { id: LESSON_ID.POINTING, strategy: STRATEGY.POINTING_ELIMINATION },
  { id: TACTIC_ID.HIDDEN_PAIR, strategy: STRATEGY.HIDDEN_PAIR },
  { id: TACTIC_ID.HIDDEN_GROUPS, strategy: STRATEGY.HIDDEN_GROUPS },
  { id: TACTIC_ID.X_WING, strategy: STRATEGY.X_WING },
  { id: TACTIC_ID.SKYSCRAPER, strategy: STRATEGY.SKYSCRAPER },
  { id: TACTIC_ID.TWO_STRING_KITE, strategy: STRATEGY.TWO_STRING_KITE },
  { id: TACTIC_ID.CRANE, strategy: STRATEGY.CRANE },
  { id: TACTIC_ID.SWORDFISH, strategy: STRATEGY.SWORDFISH },
  { id: TACTIC_ID.Y_WING, strategy: STRATEGY.Y_WING },
  { id: TACTIC_ID.XYZ_WING, strategy: STRATEGY.XYZ_WING },
  { id: TACTIC_ID.W_WING, strategy: STRATEGY.W_WING },
  { id: TACTIC_ID.EMPTY_RECTANGLE, strategy: STRATEGY.EMPTY_RECTANGLE },
  { id: TACTIC_ID.UNIQUE_RECTANGLE, strategy: STRATEGY.UNIQUE_RECTANGLE },
  { id: TACTIC_ID.SIMPLE_COLOURING, strategy: STRATEGY.SIMPLE_COLOURING },
  { id: TACTIC_ID.FINNED_X_WING, strategy: STRATEGY.FINNED_X_WING },
  { id: TACTIC_ID.WXYZ_WING, strategy: STRATEGY.WXYZ_WING },
  { id: TACTIC_ID.FINNED_SWORDFISH, strategy: STRATEGY.FINNED_SWORDFISH },
  { id: TACTIC_ID.JELLYFISH, strategy: STRATEGY.JELLYFISH },
  { id: TACTIC_ID.BUG_PLUS_ONE, strategy: STRATEGY.BUG_PLUS_ONE },
  { id: TACTIC_ID.FINNED_JELLYFISH, strategy: STRATEGY.FINNED_JELLYFISH },
  { id: TACTIC_ID.X_CHAIN, strategy: STRATEGY.X_CHAIN },
  { id: TACTIC_ID.XY_CHAIN, strategy: STRATEGY.XY_CHAIN },
  { id: LESSON_ID.MEDUSA, strategy: STRATEGY.MEDUSA_3D },
  { id: TACTIC_ID.AIC, strategy: STRATEGY.AIC },
  { id: TACTIC_ID.NISHIO, strategy: STRATEGY.NISHIO },
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
  const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] ?? DIFFICULTY_L5;
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
  const name = techniqueName(step.strategy);
  const fills = step.updates.filter((u) => u.filledValue != null);
  const elims = step.updates.filter((u) => u.eliminatedCandidate != null);

  if (fills.length > 0) {
    const digit = fills[0].filledValue!;
    return `${name}: place ${digit}`;
  }

  if (elims.length > 0) {
    const digits = [...new Set(elims.map((u) => u.eliminatedCandidate!))].sort(
      (a, b) => a - b,
    );
    const label =
      digits.length === 1
        ? String(digits[0])
        : digits.length === 2
          ? `${digits[0]} and ${digits[1]}`
          : digits.join(", ");
    const cells = new Set(elims.map((u) => u.index)).size;
    return `${name}: remove ${label} from ${cells} cell${
      cells === 1 ? "" : "s"
    }`;
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
    if (showcaseStrategies?.size && next.type === STEP_TYPE.ELIMINATION) {
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

const HUNT_TIER = {
  COMMON: "common",
  MID: "mid",
  RARE: "rare",
  ULTRA: "ultra",
} as const;

type HuntTier = (typeof HUNT_TIER)[keyof typeof HUNT_TIER];

const LESSON_HUNT_TIER: Record<string, HuntTier> = {
  [TACTIC_ID.OPEN_SINGLES]: HUNT_TIER.COMMON,
  [TACTIC_ID.NAKED_SINGLE]: HUNT_TIER.COMMON,
  [TACTIC_ID.HIDDEN_SINGLE]: HUNT_TIER.COMMON,
  [TACTIC_ID.NAKED_PAIR]: HUNT_TIER.COMMON,
  [LESSON_ID.POINTING]: HUNT_TIER.COMMON,
  [TACTIC_ID.HIDDEN_PAIR]: HUNT_TIER.MID,
  [TACTIC_ID.HIDDEN_GROUPS]: HUNT_TIER.RARE,
  [TACTIC_ID.X_WING]: HUNT_TIER.MID,
  [TACTIC_ID.SKYSCRAPER]: HUNT_TIER.MID,
  [TACTIC_ID.TWO_STRING_KITE]: HUNT_TIER.MID,
  [TACTIC_ID.CRANE]: HUNT_TIER.RARE,
  [TACTIC_ID.SWORDFISH]: HUNT_TIER.RARE,
  [TACTIC_ID.Y_WING]: HUNT_TIER.MID,
  [TACTIC_ID.XYZ_WING]: HUNT_TIER.RARE,
  [TACTIC_ID.W_WING]: HUNT_TIER.RARE,
  [TACTIC_ID.EMPTY_RECTANGLE]: HUNT_TIER.RARE,
  [TACTIC_ID.UNIQUE_RECTANGLE]: HUNT_TIER.RARE,
  [TACTIC_ID.SIMPLE_COLOURING]: HUNT_TIER.RARE,
  [TACTIC_ID.FINNED_X_WING]: HUNT_TIER.RARE,
  [TACTIC_ID.WXYZ_WING]: HUNT_TIER.ULTRA,
  [TACTIC_ID.FINNED_SWORDFISH]: HUNT_TIER.ULTRA,
  [TACTIC_ID.JELLYFISH]: HUNT_TIER.ULTRA,
  [TACTIC_ID.BUG_PLUS_ONE]: HUNT_TIER.ULTRA,
  [TACTIC_ID.FINNED_JELLYFISH]: HUNT_TIER.ULTRA,
  [TACTIC_ID.X_CHAIN]: HUNT_TIER.RARE,
  [TACTIC_ID.XY_CHAIN]: HUNT_TIER.RARE,
  [LESSON_ID.MEDUSA]: HUNT_TIER.ULTRA,
  [TACTIC_ID.AIC]: HUNT_TIER.ULTRA,
  [TACTIC_ID.NISHIO]: HUNT_TIER.ULTRA,
};

const TIER_ATTEMPTS: Record<HuntTier, number> = {
  [HUNT_TIER.COMMON]: 200,
  [HUNT_TIER.MID]: 1200,
  [HUNT_TIER.RARE]: 5000,
  [HUNT_TIER.ULTRA]: 8000,
};

const HARD_DIFFS: Difficulty[] = [
  DIFFICULTY_L6,
  DIFFICULTY_L7,
  DIFFICULTY_L8,
  DIFFICULTY_L9,
  DIFFICULTY_L10,
];
const ULTRA_DIFFS: Difficulty[] = [
  DIFFICULTY_L8,
  DIFFICULTY_L9,
  DIFFICULTY_L10,
];

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
  const tier = LESSON_HUNT_TIER[target.id] ?? HUNT_TIER.RARE;
  const {
    count = 3,
    maxAttempts = TIER_ATTEMPTS[tier],
    seedBase = 1,
    onProgress,
  } = options;

  const preferHard = tier !== HUNT_TIER.COMMON;
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
          `${target.id}: generate failed (attempt ${
            attempt + 1
          }, seed ${seed})`,
        );
      }
      continue;
    }

    const example = findExampleForStrategy(puzzle, target.strategy);
    if (!example) {
      if (preferHard && attempt % 100 === 0) {
        onProgress?.(
          `${target.id}: still searching… attempt ${
            attempt + 1
          }/${maxAttempts}`,
        );
      }
      continue;
    }

    const key = boardKey(example.board);
    if (keys.has(key)) continue;
    keys.add(key);
    found.push(example);
    onProgress?.(
      `${target.id}: found ${found.length}/${count} (attempt ${
        attempt + 1
      }, seed ${seed})`,
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
      left
        .filter(
          (t) =>
            (LESSON_HUNT_TIER[t.id] ?? HUNT_TIER.RARE) !== HUNT_TIER.COMMON,
        )
        .map((t) => t.strategy),
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
        `… attempt ${attempt + 1}/${maxAttempts}, still need: ${left
          .map((t) => t.id)
          .join(", ")}`,
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
