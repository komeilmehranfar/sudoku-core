import {Houses} from './types'

//array contains function
export const contains = (array: Array<unknown>, object: unknown) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === object) {
      return true
    }
  }
  return false
}

export const uniqueArray = (array: Array<number>): Array<number> => {
  const temp: Record<number, unknown> = {}
  for (let i = 0; i < array.length; i++) temp[array[i]] = true
  const record: number[] = []
  for (const k in temp) record.push(Number(k))
  return record
}

/* generateHouseIndexList
 * -----------------------------------------------------------------*/
export const generateHouseIndexList = (boardSize: number): Houses[] => {
  const groupOfHouses: Houses[] = [[], [], []]
  const boxSideSize = Math.sqrt(boardSize)
  for (let i = 0; i < boardSize; i++) {
    const horizontalRow = [] //horizontal row
    const verticalRow = [] //vertical row
    const box = []
    for (let j = 0; j < boardSize; j++) {
      horizontalRow.push(boardSize * i + j)
      verticalRow.push(boardSize * j + i)

      if (j < boxSideSize) {
        for (let k = 0; k < boxSideSize; k++) {
          const a = Math.floor(i / boxSideSize) * boardSize * boxSideSize
          const b = (i % boxSideSize) * boxSideSize
          const boxStartIndex = a + b //0 3 6 27 30 33 54 57 60

          box.push(boxStartIndex + boardSize * j + k)
        }
      }
    }
    groupOfHouses[0].push(horizontalRow)
    groupOfHouses[1].push(verticalRow)
    groupOfHouses[2].push(box)
  }
  return groupOfHouses
}
