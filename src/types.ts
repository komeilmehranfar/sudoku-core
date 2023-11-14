import {
  DIFFICULTY_EASY,
  DIFFICULTY_HARD,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_EXPERT,
  REMOVE_CANDIDATES,
  FILL_CELL,
} from './constants'

export type PublicBoard = Array<number | null>
type PrivateBoardCell = {
  value: number | null
  candidates: Array<number | null>
}
export type PrivateBoard = Array<PrivateBoardCell>

export type Difficulty =
  | typeof DIFFICULTY_EASY
  | typeof DIFFICULTY_MEDIUM
  | typeof DIFFICULTY_HARD
  | typeof DIFFICULTY_EXPERT
export type ApiBoardType = Array<number | null>
export type CellValue = number | null
export type Cell = {
  value: CellValue
  candidates: Array<CellValue>
  invalidCandidates?: Array<CellValue>
}
export type InternalBoardType = Array<Cell>
export type StrategyFn = () => boolean | Array<number> | -1
export interface Strategy {
  title: string
  score: number
  fn: StrategyFn
  solveType: SolveType
  prepareFn?: () => void
}

export interface Options {
  boardErrorFn?: ({message}: {message: string}) => void
  boardFinishedFn?: ({level, score}: {level: Difficulty; score: number}) => void
  boardUpdatedFn?: ({
    strategy,
    updatedCellsIndexes,
  }: {
    strategy: string
    updatedCellsIndexes: Array<number>
  }) => void
  candidateShowToggleFn?: (isShowing: boolean) => void
  initBoardData?: ApiBoardType
  difficulty?: Difficulty
}

// we call row, column, and box a house
export type House = Array<number>
// rows, columns, and boxes
export type Houses = Array<House>

export type AnalyzeData = {
  error?: string
  finished?: boolean
  usedStrategies?: ({
    title: string
    freq: number
  } | null)[]
  level?: Difficulty
  score?: number
}

export type SolveType = typeof REMOVE_CANDIDATES | typeof FILL_CELL
