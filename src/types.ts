import {
  DIFFICULTY_EASY,
  DIFFICULTY_HARD,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_EXPERT,
  SOLVE_MODE_STEP,
  SOLVE_MODE_ALL,
  DIFFICULTY_MASTER,
} from "./constants";
export type Difficulty =
  | typeof DIFFICULTY_EASY
  | typeof DIFFICULTY_MEDIUM
  | typeof DIFFICULTY_HARD
  | typeof DIFFICULTY_EXPERT
  | typeof DIFFICULTY_MASTER;
export type Board = Array<number | null>;
export type CellValue = number | null;
export type Cell = {
  value: CellValue;
  candidates: Array<CellValue>;
  invalidCandidates?: Array<CellValue>;
};
export type InternalBoard = Array<Cell>;

export type StrategyFn = () =>
  | boolean
  | Array<{ index: number; eliminatedCandidate?: number; filledValue: number }>
  | -1;
export interface Strategy {
  title: string;
  score: number;
  fn: StrategyFn;
  postFn?: () => void;
  type: "value" | "elimination";
}

export interface Update {
  index: number;
  eliminatedCandidate?: number;
  filledValue: number;
}
export interface SolvingStep {
  strategy: string;
  updates: Array<Update>;
  type: "value" | "elimination";
}
export interface Options {
  onError?: (args: { message: string }) => void;
  onFinish?: (args: { difficulty: Difficulty; score: number }) => void;
  onUpdate?: ({ strategy, updates, type }: SolvingStep) => void;
  initBoard?: Board;
  difficulty?: Difficulty;
}

// we call row, column, and box a house
export type House = Array<number>;
// rows, columns, and boxes
export type Houses = Array<House>;

export type AnalyzeData = {
  isValid?: boolean;
  usedStrategies?: ({
    title: string;
    freq: number;
  } | null)[];
  difficulty?: Difficulty;
  score?: number;
};

export type SolveType = typeof SOLVE_MODE_STEP | typeof SOLVE_MODE_ALL;
