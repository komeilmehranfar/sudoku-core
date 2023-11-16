import {
  DIFFICULTY_EASY,
  DIFFICULTY_HARD,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_EXPERT,
  SOLVE_MODE_STEP,
  SOLVE_MODE_ALL,
} from "./constants";
export type Difficulty =
  | typeof DIFFICULTY_EASY
  | typeof DIFFICULTY_MEDIUM
  | typeof DIFFICULTY_HARD
  | typeof DIFFICULTY_EXPERT;
export type Board = Array<number | null>;
export type CellValue = number | null;
export type Cell = {
  value: CellValue;
  candidates: Array<CellValue>;
  invalidCandidates?: Array<CellValue>;
};
export type InternalBoard = Array<Cell>;
export type StrategyFn = () => boolean | Array<number> | -1;
export interface Strategy {
  title: string;
  score: number;
  fn: StrategyFn;
  postFn?: () => void;
}

export interface Options {
  onError?: (args: { message: string }) => void;
  onFinish?: (args: { difficulty: Difficulty; score: number }) => void;
  onUpdate?: ({
    strategy,
    updatedIndexes,
  }: {
    strategy: string;
    updatedIndexes: Array<number>;
  }) => void;
  initBoard?: Board;
  difficulty?: Difficulty;
}

// we call row, column, and box a house
export type House = Array<number>;
// rows, columns, and boxes
export type Houses = Array<House>;

export type AnalyzeData = {
  error?: string;
  finished?: boolean;
  usedStrategies?: ({
    title: string;
    freq: number;
  } | null)[];
  difficulty?: Difficulty;
  score?: number;
};

export type SolveType = typeof SOLVE_MODE_STEP | typeof SOLVE_MODE_ALL;
