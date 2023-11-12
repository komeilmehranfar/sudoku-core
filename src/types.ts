import {
  DIFFICULTY_EASY,
  DIFFICULTY_HARD,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_EXPERT,
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
export type InputBoard = Array<number | null>
export type CellValue = number | null
export type Cell = {
  value: CellValue
  candidates: Array<CellValue>
}
export type OutputBoard = Array<Cell>
export type StrategyFn = () => boolean | Array<number> | number
export interface Strategy {
  title: string
  score: number
  fn: StrategyFn
}
