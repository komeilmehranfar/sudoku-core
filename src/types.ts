export type PublicBoard = Array<number | null>
type PrivateBoardCell = {
  value: number | null
  candidates: Array<number | null>
}
export type PrivateBoard = Array<PrivateBoardCell>
