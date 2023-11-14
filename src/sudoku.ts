import {
  DIFFICULTY_EASY,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_HARD,
  DIFFICULTY_EXPERT,
  SOLVE_MODE_STEP,
  SOLVE_MODE_ALL,
  BOARD_SIZE,
  CANDIDATES,
  NULL_CANDIDATE_LIST,
  FILL_CELL,
  REMOVE_CANDIDATES,
} from './constants'
import {
  Difficulty,
  ApiBoardType,
  CellValue,
  InternalBoardType,
  StrategyFn,
  Strategy,
  Options,
  Houses,
  House,
  AnalyzeData,
} from './types'
import {contains, uniqueArray} from './utils'

export function createSudokuInstance(options: Options = {}) {
  const {
    boardErrorFn,
    boardUpdatedFn,
    boardFinishedFn,
    initBoardData,
    difficulty = DIFFICULTY_MEDIUM,
  } = options

  let solveMode: typeof SOLVE_MODE_STEP | typeof SOLVE_MODE_ALL =
    SOLVE_MODE_STEP
  let board: InternalBoardType = []

  //solving without updating UI
  let gradingMode = false

  //silence board unsolvable errors

  //used by the generateBoard function

  /*
    the score reflects how much increased difficulty the board gets by having the pattern rather than an already solved cell
    */
  const strategies: Array<Strategy> = [
    {
      title: 'Single Remaining Cell Strategy',
      fn: solveBySingleRemainingCellStrategy,
      score: 0.1,
      solveType: FILL_CELL,
    },
    {
      title: 'Single Candidate Cell Strategy',
      fn: solveBySingleCandidateCellStrategy,
      score: 9,
      solveType: FILL_CELL,
      prepareFn: updateCandidatesBasedOnCellsValue,
    },
    {
      title: 'Single Candidate Value Strategy',
      fn: solveBySingleCandidateValueStrategy,
      score: 8,
      solveType: REMOVE_CANDIDATES,
      prepareFn: updateCandidatesBasedOnCellsValue,
    },
    {
      title: 'Naked Pair Strategy',
      fn: solveByNakedPairStrategy,
      score: 50,
      solveType: REMOVE_CANDIDATES,
    },
    {
      title: 'Pointing Elimination Strategy',
      fn: solveByPointingEliminationStrategy,
      score: 80,
      solveType: REMOVE_CANDIDATES,
    },
    //harder for human to spot
    {
      title: 'Hidden Pair Strategy',
      fn: solveByHiddenPairStrategy,
      score: 90,
      solveType: REMOVE_CANDIDATES,
    },
    {
      title: 'Naked Triplet Strategy',
      fn: solveByNakedTripletStrategy,
      score: 100,
      solveType: REMOVE_CANDIDATES,
    },
    //never gets used unless above strategies are turned off?
    {
      title: 'Hidden Triplet Strategy',
      fn: solveByHiddenTripletStrategy,
      score: 140,
      solveType: REMOVE_CANDIDATES,
    },
    //never gets used unless above strategies are turned off?
    {
      title: 'Naked Quadruple Strategy',
      fn: solveByNakedQuadrupleStrategy,
      score: 150,
      solveType: REMOVE_CANDIDATES,
    },
    //never gets used unless above strategies are turned off?
    {
      title: 'Hidden Quadruple Strategy',
      fn: solveByHiddenQuadrupleStrategy,
      score: 280,
      solveType: REMOVE_CANDIDATES,
    },
  ]

  //nr of times each strategy has been used for solving this board - used to calculate difficulty score
  let usedStrategies: Array<number> = []

  //indexes of cells in each house - generated on the fly based on BOARD_SIZE
  //horizontal. rows
  //vertical. rows
  //boxes

  // all rows, columns and boxes
  let boxOfHouses: Houses[] = [[], [], []]

  /* calculateBoardDifficulty
   * --------------
   *  TYPE: solely based on strategies required to solve board (i.e. single count per strategy)
   *  SCORE: distinguish between boards of same difficulty.. based on point system. Needs work.
   * -----------------------------------------------------------------*/
  const calculateBoardDifficulty = (
    usedStrategies: Array<number>,
  ): {level: Difficulty; score: number} => {
    const validUsedStrategies = usedStrategies.filter(Boolean)
    const totalScore = validUsedStrategies.reduce(
      (accumulatedScore, frequency, i) => {
        const strategy = strategies[i]
        return accumulatedScore + frequency * strategy.score
      },
      0,
    )
    let level: Difficulty =
      validUsedStrategies.length < 3
        ? DIFFICULTY_EASY
        : validUsedStrategies.length < 4
        ? DIFFICULTY_MEDIUM
        : DIFFICULTY_HARD

    if (totalScore > 750) level = DIFFICULTY_EXPERT
    // console.log({
    //   level,
    //   score: totalScore,
    //   validUsedStrategies,
    // })
    return {
      level,
      score: totalScore,
    }
  }

  /* isBoardFinished
   * -----------------------------------------------------------------*/
  const isBoardFinished = () => {
    return new Array(BOARD_SIZE * BOARD_SIZE)
      .fill(null)
      .every((_, i) => board[i].value !== null)
  }

  /* generateHouseIndexList
   * -----------------------------------------------------------------*/
  const generateHouseIndexList = () => {
    // reset boxOfHouses
    boxOfHouses = [[], [], []]
    const boxSideSize = Math.sqrt(BOARD_SIZE)

    for (let i = 0; i < BOARD_SIZE; i++) {
      const horizontalRow = [] //horizontal row
      const verticalRow = [] //vertical row
      const box = []
      for (let j = 0; j < BOARD_SIZE; j++) {
        horizontalRow.push(BOARD_SIZE * i + j)
        verticalRow.push(BOARD_SIZE * j + i)

        if (j < boxSideSize) {
          for (let k = 0; k < boxSideSize; k++) {
            //0, 0,0, 27, 27,27, 54, 54, 54 for a standard sudoku
            const a = Math.floor(i / boxSideSize) * BOARD_SIZE * boxSideSize
            //[0-2] for a standard sudoku
            const b = (i % boxSideSize) * boxSideSize
            const boxStartIndex = a + b //0 3 6 27 30 33 54 57 60

            //every boxSideSize box, skip BOARD_SIZE num rows to next box (on new horizontal row)
            //Math.floor(i/boxSideSize)*BOARD_SIZE*2
            //skip across horizontally to next box
            //+ i*boxSideSize;

            box.push(boxStartIndex + BOARD_SIZE * j + k)
          }
        }
      }
      boxOfHouses[0].push(horizontalRow)
      boxOfHouses[1].push(verticalRow)
      boxOfHouses[2].push(box)
    }
  }

  /* initializeBoard
   * --------------
   *  inits board, variables.
   * -----------------------------------------------------------------*/

  const initializeBoard = () => {
    const alreadyEnhanced = board[0] !== null && typeof board[0] === 'object'

    generateHouseIndexList()

    if (!alreadyEnhanced) {
      //enhance board to handle candidates, and possibly other params
      board = new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map((_, index) => {
        const value =
          typeof initBoardData?.[index] === 'undefined'
            ? null
            : initBoardData[index]
        const candidates =
          value == null ? CANDIDATES.slice() : NULL_CANDIDATE_LIST.slice()
        return {
          value,
          candidates,
        }
      })
    }
  }

  /* removeCandidatesFromCell
          -----------------------------------------------------------------*/
  const removeCandidatesFromCell = (
    cellIndex: number,
    candidatesToRemove: Array<CellValue>,
  ) => {
    const cell = board[cellIndex]
    cell.candidates = cell.candidates.filter(
      candidate => !candidatesToRemove.includes(candidate),
    )
  }

  /* removeCandidatesFromMultipleCells
           * ---returns list of cells where any candidates where removed
          -----------------------------------------------------------------*/
  const removeCandidatesFromMultipleCells = (
    cells: Array<number>,
    candidates: Array<CellValue>,
  ) => {
    const cellsUpdated = []
    for (let i = 0; i < cells.length; i++) {
      const c = board[cells[i]].candidates

      for (let j = 0; j < candidates.length; j++) {
        const candidate = candidates[j]
        //-1 because candidate '1' is at index 0 etc.
        if (c[Number(candidate) - 1] !== null) {
          c[Number(candidate) - 1] = null //NOTE: also deletes them from board variable
          cellsUpdated.push(cells[i]) //will push same cell multiple times
        }
      }
    }
    return cellsUpdated
  }

  const resetBoardVariables = () => {
    usedStrategies = []
    gradingMode = false
  }

  /* resetCandidates
          -----------------------------------------------------------------*/
  const resetCandidates = () => {
    board = new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map((_, index) => ({
      ...board[index],
      candidates:
        board[index].value == null
          ? CANDIDATES.slice()
          : board[index].candidates,
    }))
  }

  /* setBoardCell - does not update UI
          -----------------------------------------------------------------*/
  const setBoardCell = (cellIndex: number, value: CellValue) => {
    const boardCell = board[cellIndex]
    //update value
    boardCell.value = value
    if (value !== null) boardCell.candidates = NULL_CANDIDATE_LIST.slice()
  }

  /* indexInHouse
   * --------------
   *  returns index (0-9) for digit in house, false if not in house
   *  NOTE: careful evaluating returned index is IN row, as 0==false.
   * -----------------------------------------------------------------*/

  /* housesWithCell
   * --------------
   *  returns boxOfHouses that a cell belongs to
   * -----------------------------------------------------------------*/
  const housesWithCell = (cellIndex: number) => {
    const boxSideSize = Math.sqrt(BOARD_SIZE)
    const boxOfHouses = []
    //horizontal row
    const horizontalRow = Math.floor(cellIndex / BOARD_SIZE)
    boxOfHouses.push(horizontalRow)
    //vertical row
    const verticalRow = Math.floor(cellIndex % BOARD_SIZE)
    boxOfHouses.push(verticalRow)
    //box
    const box =
      Math.floor(horizontalRow / boxSideSize) * boxSideSize +
      Math.floor(verticalRow / boxSideSize)
    boxOfHouses.push(box)

    return boxOfHouses
  }

  /* getRemainingNumbers
   * --------------
   *  returns remaining numbers in a house after removing the used ones
   * -----------------------------------------------------------------*/
  const getRemainingNumbers = (house: House): Array<number> => {
    const usedNumbers = getUsedNumbers(house)

    return CANDIDATES.filter(candidate => !usedNumbers.includes(candidate))
  }

  /* getUsedNumbers
   * --------------
   *  returns used numbers in a house
   * -----------------------------------------------------------------*/
  const getUsedNumbers = (house: House) => {
    // filter out cells that have values
    return house.map(cellIndex => board[cellIndex].value).filter(Boolean)
  }

  /* getRemainingCandidates
   * --------------
   *  returns list of candidates for cell (with null's removed)
   * -----------------------------------------------------------------*/
  const getRemainingCandidates = (cellIndex: number): Array<CellValue> => {
    return board[cellIndex].candidates.filter(candidate => candidate !== null)
  }

  /* getPossibleCellsForCandidate
   * --------------
   *  returns list of possible cells (cellIndex) for candidate (in a house)
   * -----------------------------------------------------------------*/
  const getPossibleCellsForCandidate = (candidate: number, house: House) => {
    return house.filter(cellIndex =>
      board[cellIndex].candidates.includes(candidate),
    )
  }

  //Strategies

  /* solveBySingleRemainingCellStrategy
   * --------------
   * This is the simplest strategy. If there's only one empty cell in a row, column, or box (these are all "houses"), the number that goes into that cell has to be the one number that isn't elsewhere in that house.
   * For instance, if a row has the numbers 1 through 8, then the last cell in that row must be 9.
   * -----------------------------------------------------------------*/

  function solveBySingleRemainingCellStrategy(): ReturnType<StrategyFn> {
    const houses = boxOfHouses.length

    for (let i = 0; i < houses; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const singleEmptyCell = findSingleEmptyCellInHouse(boxOfHouses[i][j])

        if (singleEmptyCell) {
          return fillSingleEmptyCell(singleEmptyCell)
        }

        if (isBoardFinished()) {
          boardFinishedFn?.(calculateBoardDifficulty(usedStrategies))
          return true
        }
      }
    }
    return false
  }

  function findSingleEmptyCellInHouse(house: House) {
    const emptyCells = []

    for (let k = 0; k < BOARD_SIZE; k++) {
      const boardIndex = house[k]
      if (board[boardIndex].value == null) {
        emptyCells.push({house: house, cellIndex: boardIndex})
        if (emptyCells.length > 1) {
          break
        }
      }
    }

    // If only one empty cell found
    return emptyCells.length === 1 ? emptyCells[0] : null
  }

  function fillSingleEmptyCell(emptyCell: {
    house: number[]
    cellIndex: number
  }) {
    const value = getRemainingNumbers(emptyCell.house)

    if (value.length > 1) {
      boardErrorFn?.({message: 'Board Incorrect'})
      return -1
    }

    setBoardCell(emptyCell.cellIndex, value[0]) //does not update UI
    return [emptyCell.cellIndex]
  }

  /* updateCandidatesBasedOnCellsValue
  * --------------
  * ALWAYS returns false
  * -- special compared to other strategies: doesn't step - updates whole board,
  in one go. Since it also only updates candidates, we can skip straight to next strategy, since we know that neither this one nor the one(s) before (that only look at actual numbers on board), will find anything new.
  * -----------------------------------------------------------------*/
  function updateCandidatesBasedOnCellsValue() {
    const boxOfHousesLength = boxOfHouses.length
    for (let i = 0; i < boxOfHousesLength; i++) {
      processEachHouseType(i)
    }
    return false
  }

  function processEachHouseType(houseType: number) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const house = boxOfHouses[houseType][j]
      const candidatesToRemove = getUsedNumbers(house)
      removeCandidatesFromEachHouse(house, candidatesToRemove)
    }
  }

  function removeCandidatesFromEachHouse(
    house: House,
    candidatesToRemove: CellValue[],
  ) {
    for (let k = 0; k < BOARD_SIZE; k++) {
      const cell = house[k]
      removeCandidatesFromCell(cell, candidatesToRemove)
    }
  }

  const convertInitialBoardToSerializedBoard = (
    _board: ApiBoardType,
  ): InternalBoardType => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map((_, i) => ({
      value: _board[i] || null,
      candidates:
        _board[i] == null ? CANDIDATES.slice() : NULL_CANDIDATE_LIST.slice(),
    }))
  }

  /* solveBySingleCandidateValueStrategy
   * --------------
   * This strategy looks at houses where a number only appears as a candidate in one cell.
   * If every other cell in a house already contains a number or can't possibly contain a certain number, then that number must go in the one cell where it's still a candidate.
   * For example, if in a row the number 3 can only be placed in the third cell, then it must go there.
   * -----------------------------------------------------------------*/
  function solveBySingleCandidateValueStrategy(): ReturnType<StrategyFn> {
    //log("visualElimination");
    //for each type of house..(hor row / vert row / box)
    const boxOfHousesLength = boxOfHouses.length
    for (let i = 0; i < boxOfHousesLength; i++) {
      //for each such house
      for (let j = 0; j < BOARD_SIZE; j++) {
        const house = boxOfHouses[i][j]
        const digits = getRemainingNumbers(house)

        //for each digit left for that house
        for (let k = 0; k < digits.length; k++) {
          const digit = digits[k]
          const possibleCells = []

          //for each cell in house
          for (let l = 0; l < BOARD_SIZE; l++) {
            const cell = house[l]
            const boardCell = board[cell]
            //if the digit only appears as a candidate in one slot, that's where it has to go
            if (contains(boardCell.candidates, digit)) {
              possibleCells.push(cell)
              if (possibleCells.length > 1) break //no we can't tell anything in this case
            }
          }

          if (possibleCells.length === 1) {
            const cellIndex = possibleCells[0]

            //log("only slot where "+digit+" appears in house. ");

            setBoardCell(cellIndex, digit) //does not update UI

            return [cellIndex] //one step at the time
          }
        }
      }
    }
    return false
  }

  /* solveBySingleCandidateCellStrategy
   * --------------
   * Looks for cells with only one candidate
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function solveBySingleCandidateCellStrategy(): ReturnType<StrategyFn> {
    //before we start with candidate strategies, we need to update candidates from last round:

    for (let i = 0; i < board.length; i++) {
      const cell = board[i]
      const candidates = cell.candidates

      //for each candidate for that cell
      const possibleCandidates = []
      for (let j = 0; j < candidates.length; j++) {
        if (candidates[j] !== null) possibleCandidates.push(candidates[j])
        if (possibleCandidates.length > 1) break //can't find answer here
      }
      if (possibleCandidates.length === 1) {
        const digit = possibleCandidates[0]

        //log("only one candidate in cell: "+digit+" in house. ");

        setBoardCell(i, digit) //does not update UI

        return [i] //one step at the time
      }
    }
    return false
  }

  /* solveByPointingEliminationStrategy
   * --------------
   * This strategy is used when a certain number appears only in a single row or column within a box. That means this number can be eliminated from the other cells in that row or column that are not in this box. For example, if in a box the number 4 only appears in the cells of the first row, then the number 4 can be removed from the rest of the cells in the first row that are not in this box.
   * -----------------------------------------------------------------*/
  function solveByPointingEliminationStrategy() {
    //for each type of house..(hor row / vert row / box)
    const boxOfHousesLength = boxOfHouses.length
    for (let a = 0; a < boxOfHousesLength; a++) {
      const houseType = a

      for (let i = 0; i < BOARD_SIZE; i++) {
        const house = boxOfHouses[houseType][i]

        //for each digit left for this house
        const digits = getRemainingNumbers(house)
        for (let j = 0; j < digits.length; j++) {
          const digit = digits[j]
          //check if digit (candidate) only appears in one row (if checking boxes),
          //, or only in one box (if checking rows)

          let sameAltHouse = true //row if checking box, and vice versa
          let houseId = -1
          //when point checking from box, need to compare both kind of rows
          //that box cells are also part of, so use houseTwoId as well
          let houseTwoId = -1
          let sameAltTwoHouse = true
          const cellsWithCandidate = []
          //let cellDistance = null;

          //for each cell
          for (let k = 0; k < house.length; k++) {
            const cell = house[k]

            if (contains(board[cell].candidates, digit)) {
              const cellHouses = housesWithCell(cell)
              const newHouseId = houseType === 2 ? cellHouses[0] : cellHouses[2]
              const newHouseTwoId =
                houseType === 2 ? cellHouses[1] : cellHouses[2]

              //if(cellsWithCandidate.length > 0){ //why twice the same?

              if (cellsWithCandidate.length > 0) {
                if (newHouseId !== houseId) {
                  sameAltHouse = false
                }
                if (houseTwoId !== newHouseTwoId) {
                  sameAltTwoHouse = false
                }
                if (sameAltHouse === false && sameAltTwoHouse === false) {
                  break //not in same altHouse (box/row)
                }
              }
              //}
              houseId = newHouseId
              houseTwoId = newHouseTwoId
              cellsWithCandidate.push(cell)
            }
          }
          if (
            (sameAltHouse === true || sameAltTwoHouse === true) &&
            cellsWithCandidate.length > 0
          ) {
            //log("sameAltHouse..");
            //we still need to check that this actually eliminates something, i.e. these possible cells can't be only in house

            //first figure out what kind of house we are talking about..
            const h = housesWithCell(cellsWithCandidate[0])
            let altHouseType = 2
            if (houseType === 2) {
              if (sameAltHouse) altHouseType = 0
              else altHouseType = 1
            }

            const altHouse = boxOfHouses[altHouseType][h[altHouseType]]
            const cellsEffected = []

            //log("boxOfHouses["+houseType+"]["+h[houseType]+"].length: "+boxOfHouses[houseType][h[houseType]].length);

            //need to remove cellsWithCandidate - from cells to remove from
            for (let x = 0; x < altHouse.length; x++) {
              if (!cellsWithCandidate.includes(altHouse[x])) {
                cellsEffected.push(altHouse[x])
              }
            }
            //log("boxOfHouses["+houseType+"]["+h[houseType]+"].length: "+boxOfHouses[houseType][h[houseType]].length);

            //remove all candidates on altHouse, outside of house
            const cellsUpdated = removeCandidatesFromMultipleCells(
              cellsEffected,
              [digit],
            )

            if (cellsUpdated.length > 0) {
              // log("pointing: digit "+digit+", from houseType: "+houseType);

              //return cellsUpdated.concat(cellsWithCandidate);
              //only return cells where we actually update candidates
              return cellsUpdated
            }
          }
        }
      }
    }
    return false
  }

  /* nakedCandidatesStrategy
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function nakedCandidatesStrategy(number: number) {
    let combineInfo: Array<{
      cell: number
      candidates: Array<CellValue>
    }> = []
    let minIndexes = [-1]
    //for each type of house..(hor row / vert row / box)
    const boxOfHousesLength = boxOfHouses.length
    for (let i = 0; i < boxOfHousesLength; i++) {
      //for each such house
      for (let j = 0; j < BOARD_SIZE; j++) {
        //log("["+i+"]"+"["+j+"]");
        const house = boxOfHouses[i][j]
        if (getRemainingNumbers(house).length <= number)
          //can't eliminate any candidates
          continue
        combineInfo = [] //{cell: x, candidates: []}, {} ..
        //combinedCandidates,cellsWithCandidate;
        minIndexes = [-1]
        //log("--------------");
        //log("house: ["+i+"]["+j+"]");

        //checks every combo of n candidates in house, returns pattern, or false
        const result = checkCombinedCandidates(house, 0)
        if (result !== false) return result
      }
    }
    return false //pattern not found

    function checkCombinedCandidates(
      house: House,
      startIndex: number,
    ): ReturnType<StrategyFn> {
      //log("startIndex: "+startIndex);
      for (
        let i = Math.max(startIndex, minIndexes[startIndex]);
        i < BOARD_SIZE - number + startIndex;
        i++
      ) {
        //log(i);

        //never check this cell again, in this loop
        minIndexes[startIndex] = i + 1
        //or in a this loop deeper down in recursions
        minIndexes[startIndex + 1] = i + 1

        //if(startIndex === 0){
        //	combinedCandidates = [];
        //	cellsWithCandidate = []; //reset
        //}
        const cell = house[i]
        const cellCandidates = getRemainingCandidates(cell)

        if (cellCandidates.length === 0 || cellCandidates.length > number)
          continue

        //try adding this cell and it's cellCandidates,
        //but first need to check that that doesn't make (unique) amount of
        //candidates in combineInfo > n

        //if this is the first item we add, we don't need this check (above one is enough)
        if (combineInfo.length > 0) {
          const temp = cellCandidates.slice()
          for (let a = 0; a < combineInfo.length; a++) {
            const candidates = combineInfo[a].candidates || []
            for (let b = 0; b < candidates.length; b++) {
              if (!contains(temp, candidates[b])) temp.push(candidates[b])
            }
          }
          if (temp.length > number) {
            continue //combined candidates spread over > n cells, won't work
          }
        }

        combineInfo.push({cell, candidates: cellCandidates})

        if (startIndex < number - 1) {
          //still need to go deeper into combo
          const result = checkCombinedCandidates(house, startIndex + 1)
          //when we come back, check if that's because we found answer.
          //if so, return with it, otherwise, keep looking
          if (result !== false) return result
        }

        //check if we match our pattern
        //if we have managed to combine n-1 cells,
        //(we already know that combinedCandidates is > n)
        //then we found a match!
        if (combineInfo.length === number) {
          //now we need to check whether this eliminates any candidates

          //now we need to check whether this eliminates any candidates

          const cellsWithCandidates = []
          let combinedCandidates: Array<CellValue> = [] //not unique either..
          for (let x = 0; x < combineInfo.length; x++) {
            cellsWithCandidates.push(combineInfo[x].cell)
            combinedCandidates = combinedCandidates.concat(
              combineInfo[x].candidates || [],
            )
          }

          //get all cells in house EXCEPT cellsWithCandidates
          const cellsEffected = []
          for (let y = 0; y < BOARD_SIZE; y++) {
            if (!contains(cellsWithCandidates, house[y])) {
              cellsEffected.push(house[y])
            }
          }

          //remove all candidates on house, except the on cells matched in pattern
          const cellsUpdated = removeCandidatesFromMultipleCells(
            cellsEffected,
            combinedCandidates,
          )

          //if it does remove candidates, we're succeeded!
          if (cellsUpdated.length > 0) {
            //log("nakedCandidates: ");
            //log(combinedCandidates);

            //return cellsWithCandidates.concat(cellsUpdated);

            //return cells we actually update, duplicates removed
            return uniqueArray(cellsUpdated)
          }
        }
      }
      if (startIndex > 0) {
        //if we added a value to our combo check, but failed to find pattern, we now need drop that value and go back up in chain and continue to check..
        if (combineInfo.length > startIndex - 1) {
          //log("nakedCans: need to pop last added values..");
          combineInfo.pop()
        }
      }
      return false
    }
  }

  /* solveByNakedPairStrategy
   * --------------
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function solveByNakedPairStrategy() {
    return nakedCandidatesStrategy(2)
  }

  /* solveByNakedTripletStrategy
   * --------------
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function solveByNakedTripletStrategy() {
    return nakedCandidatesStrategy(3)
  }

  /* solveByNakedQuadrupleStrategy
   * --------------
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function solveByNakedQuadrupleStrategy() {
    return nakedCandidatesStrategy(4)
  }

  /* hiddenLockedCandidates
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function hiddenLockedCandidates(number: number) {
    let combineInfo: Array<{
      candidate: number
      cells: Array<number>
    }> = []
    let minIndexes = [-1]
    function checkLockedCandidates(
      house: House,
      startIndex: number,
    ): number[] | boolean {
      //log("startIndex: "+startIndex);
      for (
        let i = Math.max(startIndex, minIndexes[startIndex]);
        i <= BOARD_SIZE - number + startIndex;
        i++
      ) {
        //log(i);
        //never check this cell again, in this loop
        minIndexes[startIndex] = i + 1
        //or in a this loop deeper down in recursions
        minIndexes[startIndex + 1] = i + 1

        const candidate = i + 1
        //log(candidate);

        const possibleCells = getPossibleCellsForCandidate(candidate, house)

        if (possibleCells.length === 0 || possibleCells.length > number)
          continue

        //try adding this candidate and it's possible cells,
        //but first need to check that that doesn't make (unique) amount of
        //possible cells in combineInfo > n
        if (combineInfo.length > 0) {
          const temp = possibleCells.slice()
          for (let a = 0; a < combineInfo.length; a++) {
            const cells = combineInfo[a].cells
            for (let b = 0; b < cells.length; b++) {
              if (!contains(temp, cells[b])) temp.push(cells[b])
            }
          }
          if (temp.length > number) {
            //log("combined candidates spread over > n cells");
            continue //combined candidates spread over > n cells, won't work
          }
        }

        combineInfo.push({candidate: candidate, cells: possibleCells})

        if (startIndex < number - 1) {
          //still need to go deeper into combo
          const r = checkLockedCandidates(house, startIndex + 1)
          //when we come back, check if that's because we found answer.
          //if so, return with it, otherwise, keep looking
          if (r !== false) return r
        }
        //check if we match our pattern
        //if we have managed to combine n-1 candidates,
        //(we already know that cellsWithCandidates is <= n)
        //then we found a match!
        if (combineInfo.length === number) {
          //now we need to check whether this eliminates any candidates

          const combinedCandidates = [] //not unique now...
          let cellsWithCandidates: number[] = [] //not unique either..
          for (let x = 0; x < combineInfo.length; x++) {
            combinedCandidates.push(combineInfo[x].candidate)
            cellsWithCandidates = cellsWithCandidates.concat(
              combineInfo[x].cells,
            )
          }

          const candidatesToRemove = []
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (!contains(combinedCandidates, c + 1))
              candidatesToRemove.push(c + 1)
          }
          //log("candidates to remove:")
          //log(candidatesToRemove);

          //remove all other candidates from cellsWithCandidates
          const cellsUpdated = removeCandidatesFromMultipleCells(
            cellsWithCandidates,
            candidatesToRemove,
          )

          //if it does remove candidates, we're succeded!
          if (cellsUpdated.length > 0) {
            //log("hiddenLockedCandidates: ");
            //log(combinedCandidates);

            //filter out duplicates
            return uniqueArray(cellsWithCandidates)
          }
        }
      }
      if (startIndex > 0) {
        //if we added a value to our combo check, but failed to find pattern, we now need drop that value and go back up in chain and continu to check..
        if (combineInfo.length > startIndex - 1) {
          combineInfo.pop()
        }
      }
      return false
    }
    //for each type of house..(hor row / vert row / box)
    const boxOfHousesLength = boxOfHouses.length
    for (let i = 0; i < boxOfHousesLength; i++) {
      //for each such house
      for (let j = 0; j < BOARD_SIZE; j++) {
        const house = boxOfHouses[i][j]
        if (getRemainingNumbers(house).length <= number)
          //can't eliminate any candidates
          continue
        combineInfo = []
        minIndexes = [-1]

        //checks every combo of n candidates in house, returns pattern, or false
        const result = checkLockedCandidates(house, 0)
        if (result !== false) return result
      }
    }
    return false //pattern not found
  }

  /* solveByHiddenPairStrategy
   * --------------
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function solveByHiddenPairStrategy() {
    return hiddenLockedCandidates(2)
  }

  /* solveByHiddenTripletStrategy
   * --------------
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function solveByHiddenTripletStrategy() {
    return hiddenLockedCandidates(3)
  }

  /* solveByHiddenQuadrupleStrategy
   * --------------
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function solveByHiddenQuadrupleStrategy() {
    return hiddenLockedCandidates(4)
  }

  /* applySolvingStrategies
   * --------------
   *  applies strategy i (where i represents strategy, ordered by simplicity
   *  -if strategy fails (too advanced a sudoku) AND an more advanced strategy exists:
   *		calls itself with i++
   *  returns canContinue true|false - only relevant for solveMode "all"
   * -----------------------------------------------------------------*/

  const applySolvingStrategies = (
    strategyIndex: number,
  ): boolean | undefined => {
    if (isBoardFinished()) {
      if (!gradingMode) {
        boardFinishedFn?.(calculateBoardDifficulty(usedStrategies))
      }
      return false
    }

    strategies[strategyIndex].prepareFn?.()
    const effectedCells = strategies[strategyIndex].fn()

    if (effectedCells === false) {
      if (strategies.length > strategyIndex + 1) {
        return applySolvingStrategies(strategyIndex + 1)
      } else {
        boardErrorFn?.({message: 'No More Strategies To Solve The Board'})
        return false
      }
    }
    if (effectedCells === -1) {
      return false
    }

    if (solveMode === SOLVE_MODE_STEP) {
      if (typeof boardUpdatedFn === 'function') {
        boardUpdatedFn({
          strategy: strategies[strategyIndex].title,
          updatedCellsIndexes: effectedCells as Array<number>,
        })
      }

      if (isBoardFinished()) {
        boardFinishedFn?.(calculateBoardDifficulty(usedStrategies))
      }
    }

    if (typeof usedStrategies[strategyIndex] === 'undefined') {
      usedStrategies[strategyIndex] = 0
    }

    usedStrategies[strategyIndex] += 1

    return true
  }

  /* analyzeBoard
   * solves a copy of the current board(without updating the UI),
   * reports back: error|finished, usedStrategies and difficulty level and score
   * -----------------------------------------------------------------*/
  const analyzeBoard = () => {
    solveMode = SOLVE_MODE_ALL

    const usedStrategiesClone = [...usedStrategies]
    const boardClone = JSON.parse(JSON.stringify(board))

    let canContinue: boolean | undefined = true
    do {
      const startStrategy = 0
      canContinue = applySolvingStrategies(startStrategy)
    } while (canContinue)

    const data: AnalyzeData = {
      finished: isBoardFinished(),
      usedStrategies: strategies
        .map((strategy, i) => {
          if (typeof usedStrategies[i] !== 'undefined') {
            return {
              title: strategy.title,
              freq: usedStrategies[i],
            }
          }
          return null
        })
        .filter(Boolean),
    }

    if (isBoardFinished()) {
      const boardDiff = calculateBoardDifficulty(usedStrategies)
      data.level = boardDiff.level
      data.score = boardDiff.score
    }

    resetBoardVariables()
    usedStrategies = usedStrategiesClone
    board = boardClone

    return data
  }
  const getRandomCandidateOfCell = (candidates: Array<CellValue>) => {
    const randomIndex = Math.floor(Math.random() * candidates.length)
    return candidates[randomIndex]
  }

  const setBoardCellWithRandomCandidate = (cellIndex: number) => {
    // CHECK still valid
    updateCandidatesBasedOnCellsValue()
    // DRAW RANDOM CANDIDATE
    // don't draw already invalidated candidates for cell
    const invalids = board[cellIndex].invalidCandidates || []
    // TODO: don't use JS filter - not supported enough(?)
    const candidates = board[cellIndex].candidates.filter(
      candidate => Boolean(candidate) && !invalids.includes(candidate),
    )
    // if cell has 0 candidates - fail to set cell.
    if (candidates.length === 0) {
      return false
    }
    const value = getRandomCandidateOfCell(candidates)
    setBoardCell(cellIndex, value)
    return true
  }

  const invalidPreviousCandidateAndStartOver = (cellIndex: number) => {
    const previousIndex = cellIndex - 1

    board[previousIndex].invalidCandidates =
      board[previousIndex].invalidCandidates || []

    board[previousIndex].invalidCandidates?.push(board[previousIndex].value)

    setBoardCell(previousIndex, null)
    resetCandidates()
    board[cellIndex].invalidCandidates = []

    generateBoardAnswerRecursively(previousIndex)
  }
  const generateBoardAnswerRecursively = (cellIndex: number) => {
    if (cellIndex + 1 > BOARD_SIZE * BOARD_SIZE) {
      board.forEach(cell => (cell.invalidCandidates = []))
      return true
    }
    if (setBoardCellWithRandomCandidate(cellIndex)) {
      generateBoardAnswerRecursively(cellIndex + 1)
    } else {
      invalidPreviousCandidateAndStartOver(cellIndex)
    }
  }

  const easyEnough = (
    difficulty: Difficulty,
    currentDifficulty: Difficulty,
  ): boolean => {
    if (currentDifficulty === DIFFICULTY_EASY) return true
    if (currentDifficulty === DIFFICULTY_MEDIUM)
      return difficulty !== DIFFICULTY_EASY
    if (currentDifficulty === DIFFICULTY_HARD)
      return difficulty !== DIFFICULTY_EASY && difficulty !== DIFFICULTY_MEDIUM
    if (currentDifficulty === DIFFICULTY_EXPERT)
      return (
        difficulty !== DIFFICULTY_EASY &&
        difficulty !== DIFFICULTY_MEDIUM &&
        difficulty !== DIFFICULTY_HARD
      )

    return false
  }
  const isHardEnough = (
    difficulty: Difficulty,
    currentDifficulty: Difficulty,
  ): boolean => {
    if (difficulty === DIFFICULTY_EASY) return true
    if (difficulty === DIFFICULTY_MEDIUM)
      return currentDifficulty !== DIFFICULTY_EASY
    if (difficulty === DIFFICULTY_HARD)
      return (
        currentDifficulty !== DIFFICULTY_EASY &&
        currentDifficulty !== DIFFICULTY_MEDIUM
      )
    if (difficulty === DIFFICULTY_EXPERT)
      return (
        currentDifficulty !== DIFFICULTY_EASY &&
        currentDifficulty !== DIFFICULTY_MEDIUM &&
        currentDifficulty !== DIFFICULTY_HARD
      )

    return false
  }

  const prepareGameBoard = () => {
    const cells = Array.from({length: BOARD_SIZE * BOARD_SIZE}, (_, i) => i)
    let remainingCells = getRemainingCellsBasedOnDifficulty()
    while (remainingCells > 0 && cells.length > 0) {
      const randIndex = Math.round(Math.random() * (cells.length - 1))
      const [cellIndex] = cells.splice(randIndex, 1)
      const cellValue = board[cellIndex].value

      // Remove value from this cell
      setBoardCell(cellIndex, null)
      // Reset candidates, only in model.
      resetCandidates()

      const boardAnalysis = analyzeBoard()
      // console.log(cells)
      if (
        boardAnalysis.finished &&
        boardAnalysis.level &&
        easyEnough(difficulty, boardAnalysis.level)
      ) {
        remainingCells--
      } else {
        // Reset - don't dig this cell
        setBoardCell(cellIndex, cellValue)
      }
    }
  }

  const getRemainingCellsBasedOnDifficulty = () => {
    switch (difficulty) {
      case DIFFICULTY_EASY:
        return BOARD_SIZE * BOARD_SIZE - 40
      case DIFFICULTY_MEDIUM:
        return BOARD_SIZE * BOARD_SIZE - 30
      default:
        return BOARD_SIZE * BOARD_SIZE - 17
    }
  }

  // generates board puzzle, i.e. the answers for this round
  // requires that a board for BOARD_SIZE has already been initiated
  const generateBoard = () => {
    solveMode = SOLVE_MODE_ALL

    generateBoardAnswerRecursively(0)

    // attempt one - save the answer, and try digging multiple times.
    const boardAnswer = board.slice()

    let boardTooEasy = true
    while (boardTooEasy) {
      prepareGameBoard()
      const data = analyzeBoard()
      if (data.level && isHardEnough(difficulty, data.level)) {
        boardTooEasy = false
      } else {
        board = boardAnswer
      }
    }
    solveMode = SOLVE_MODE_STEP
    updateCandidatesBasedOnCellsValue()
  }

  /*
   * init/API/events
   *-----------*/
  try {
    if (!initBoardData) {
      initializeBoard()
      generateBoard()
    } else {
      board = convertInitialBoardToSerializedBoard(initBoardData)
      initializeBoard()
      updateCandidatesBasedOnCellsValue()
      analyzeBoard()
    }
  } catch (e) {
    boardErrorFn?.({message: e as string})
  }

  /**
   * PUBLIC methods
   * ----------------- */
  const solveAll = () => {
    solveMode = SOLVE_MODE_ALL
    let canContinue: boolean | undefined = true
    while (canContinue) {
      const startStrategyIndex = 0
      canContinue = applySolvingStrategies(startStrategyIndex)
    }
  }

  const solveStep = () => {
    solveMode = SOLVE_MODE_STEP
    const startStrategyIndex = 0
    applySolvingStrategies(startStrategyIndex)
  }

  const getBoard = () => board.map(cell => cell.value)

  // console.log(analyzeBoard().level, getBoard().filter(Boolean).length)

  return {
    solveAll,
    solveStep,
    analyzeBoard,
    getBoard,
    generateBoard,
  }
}
