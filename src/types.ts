import { DIFFICULTIES } from "./board/constants";

export type Difficulty = (typeof DIFFICULTIES)[number];

export type Board = Array<number | null>;

export interface Update {
  index: number;
  eliminatedCandidate?: number;
  filledValue?: number;
  /** Pencil-mark teaching: add this candidate into the cell's notes */
  addedCandidate?: number;
}

export interface SolvingStep {
  strategy: string;
  updates: Update[];
  type: "value" | "elimination" | "add";
  /** Technique nodes (e.g. kite ends / conjugates) for teaching highlights */
  patternCells?: number[];
  /** Digits that define the pattern (e.g. naked/hidden pair {2,6}) */
  patternDigits?: number[];
  /** Houses to shade (row/col/box cells involved in the pattern) */
  regionCells?: number[];
}

export interface AnalyzeData {
  hasSolution: boolean;
  hasUniqueSolution?: boolean;
  usedStrategies?: Array<{ title: string; freq: number } | null>;
  difficulty?: Difficulty;
  score?: number;
  hardestTechnique?: string;
  hardestRank?: number;
  tedium?: number;
}

export interface SolvingResult {
  solved: boolean;
  board?: Board;
  steps?: SolvingStep[];
  analysis?: AnalyzeData;
  error?: string;
}
