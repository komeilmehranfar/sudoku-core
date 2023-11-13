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
} from './constants'
// import {openSinglesStrategy} from './strategies/openSinglesStrategy'
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

const defaultOptions: Options = {
  difficulty: DIFFICULTY_MEDIUM,
}

export function createSudokuInstance(options: Options = defaultOptions) {
  const {
    boardErrorFn,
    boardUpdatedFn,
    boardFinishedFn,
    initBoardData,
    difficulty,
  } = {...defaultOptions, ...options}

  let solveMode: typeof SOLVE_MODE_STEP | typeof SOLVE_MODE_ALL =
    SOLVE_MODE_STEP
  let board: InternalBoardType = []

  let boardFinished = false
  let boardError = false
  let onlyUpdatedCandidates = false

  //solving without updating UI
  let gradingMode = false

  //silence board unsolvable errors
  let generatingMode = false

  //used by the generateBoard function
  let invalidCandidates: CellValue[][] = []

  /*
    the score reflects how much increased difficulty the board gets by having the pattern rather than an already solved cell
    */
  const strategies: Array<Strategy> = [
    {title: 'Open Singles Strategy', fn: openSinglesStrategy, score: 0.1},
    //harder for human to spot
    {title: 'Single Candidate Strategy', fn: singleCandidateStrategy, score: 9},
    {
      title: 'Visual Elimination Strategy',
      fn: visualEliminationStrategy,
      score: 8,
    },
    //only eliminates one candidate, should have lower score?
    {title: 'Naked Pair Strategy', fn: nakedPairStrategy, score: 50},
    {
      title: 'Pointing Elimination Strategy',
      fn: pointingElimination,
      score: 80,
    },
    //harder for human to spot
    {title: 'Hidden Pair Strategy', fn: hiddenPairStrategy, score: 90},
    {title: 'Naked Triplet Strategy', fn: nakedTripletStrategy, score: 100},
    //never gets used unless above strategies are turned off?
    {title: 'Hidden Triplet Strategy', fn: hiddenTripletStrategy, score: 140},
    //never gets used unless above strategies are turned off?
    {title: 'Naked Quadruple Strategy', fn: nakedQuadrupleStrategy, score: 150},
    //never gets used unless above strategies are turned off?
    {
      title: 'Hidden Quadruple Strategy',
      fn: hiddenQuadrupleStrategy,
      score: 280,
    },
  ]

  //nr of times each strategy has been used for solving this board - used to calculate difficulty score
  let usedStrategies: Array<number> = []

  /*board variable gets enhanced into list of objects on init:
            ,{
                value: null
                ,candidates: [
                    ]
            }
        */

  // array of 1-9 by default, generated in initializeBoard

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
    const totalScore = usedStrategies.reduce(
      (accumulatedScore, frequency, i) => {
        if (!frequency) return accumulatedScore //undefined or 0, won't effect score
        const strategy = strategies[i]
        return accumulatedScore + frequency * strategy.score
      },
      0,
    )

    let level: Difficulty =
      usedStrategies.length < 3
        ? DIFFICULTY_EASY
        : usedStrategies.length < 4
        ? DIFFICULTY_MEDIUM
        : DIFFICULTY_HARD

    if (totalScore > 750) level = DIFFICULTY_EXPERT

    return {
      level,
      score: totalScore,
    }
  }

  /* isBoardFinished
   * -----------------------------------------------------------------*/
  const isBoardFinished = () => {
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      if (board[i].value === null) return false
    }
    return true
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
          value === null ? CANDIDATES.slice() : NULL_CANDIDATE_LIST.slice()
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
    const cellsUpdated = cells.reduce((updatedCells, cellIndex) => {
      const cell = board[cellIndex]
      const initialCandidatesLength = cell.candidates.length
      cell.candidates = cell.candidates.filter(
        candidate => !candidates.includes(candidate),
      )
      if (cell.candidates.length !== initialCandidatesLength) {
        updatedCells.push(cellIndex)
      }
      return updatedCells
    }, [] as Array<number>)

    return cellsUpdated
  }

  const resetBoardVariables = () => {
    boardFinished = false
    boardError = false
    onlyUpdatedCandidates = false
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
  const getRemainingCandidates = (cellIndex: number): Array<number> => {
    return board[cellIndex].candidates.filter(
      candidate => candidate !== null,
    ) as Array<number>
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

  /* openSinglesStrategy
   * --------------
   *  checks for boxOfHouses with just one empty cell - fills it in board variable if so
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function openSinglesStrategy(): ReturnType<StrategyFn> {
    //log("looking for openSinglesStrategy");

    //for each type of house..(hor row / vert row / box)
    for (let i = 0; i < boxOfHouses.length; i++) {
      //for each such house
      let housesCompleted = 0 //if goes up to 9, sudoku is finished

      for (let j = 0; j < BOARD_SIZE; j++) {
        const emptyCells = []

        // for each cell..
        for (let k = 0; k < BOARD_SIZE; k++) {
          const boardIndex = boxOfHouses[i][j][k]
          if (board[boardIndex].value === null) {
            emptyCells.push({house: boxOfHouses[i][j], cell: boardIndex})
            if (emptyCells.length > 1) {
              //log("more than one empty cell, house area :["+i+"]["+j+"]");
              break
            }
          }
        }
        //one empty cell found
        if (emptyCells.length === 1) {
          const emptyCell = emptyCells[0]
          //grab number to fill in in cell
          const value = getRemainingNumbers(emptyCell.house)
          if (value.length > 1) {
            //log("openSinglesStrategy found more than one answer for: "+emptyCell.cell+" .. board incorrect!");
            boardError = true //to force solve all loop to stop
            return -1 //error
          }

          //log("fill in single empty cell " + emptyCell.cell+", value: "+value);

          setBoardCell(emptyCell.cell, value[0]) //does not update UI

          return [emptyCell.cell]
        }
        //no empty ells..
        if (emptyCells.length === 0) {
          housesCompleted++
          //log(i+" "+j+": "+housesCompleted);
          if (housesCompleted === BOARD_SIZE) {
            boardFinished = true
            return -1 //special case, done
          }
        }
      }
    }
    return false
  }

  /* eliminateCandidatesVisually
           * --------------
           * ALWAYS returns false
           * -- special compared to other strategies: doesn't step - updates whole board,
           in one go. Since it also only updates candidates, we can skip straight to next strategy, since we know that neither this one nor the one(s) before (that only look at actual numbers on board), will find anything new.
           * -----------------------------------------------------------------*/
  function eliminateCandidatesVisually() {
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
      removeCandidatesFromCell(cell, candidatesToRemove as Array<number>)
    }
  }

  const convertBoardToSerializedBoard = (
    ApiBoardType: ApiBoardType,
  ): InternalBoardType => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Array(81).fill(null).map((_, i) => ({
      value: ApiBoardType[i] || null,
      candidates:
        ApiBoardType[i] === null ? CANDIDATES.slice() : new Array(9).fill(null),
    }))
  }
  /* visualEliminationStrategy
   * --------------
   * Looks for boxOfHouses where a digit only appears in one slot
   * -meaning we know the digit goes in that slot.
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function visualEliminationStrategy(): ReturnType<StrategyFn> {
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

            onlyUpdatedCandidates = false
            return [cellIndex] //one step at the time
          }
        }
      }
    }
    return false
  }

  /* singleCandidateStrategy
   * --------------
   * Looks for cells with only one candidate
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function singleCandidateStrategy(): ReturnType<StrategyFn> {
    //before we start with candidate strategies, we need to update candidates from last round:
    eliminateCandidatesVisually() //TODO: a bit hacky, should probably not be here

    //for each cell

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

        onlyUpdatedCandidates = false
        return [i] //one step at the time
      }
    }
    return false
  }

  /* pointingElimination
           * --------------
           * if candidates of a type (digit) in a box only appear on one row, all other
           * same type candidates can be removed from that row
           ------------OR--------------
           * same as above, but row instead of box, and vice versa.
           * -- returns effectedCells - the updated cell(s), or false
           * -----------------------------------------------------------------*/
  function pointingElimination() {
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

              onlyUpdatedCandidates = true

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
           * --------------
           * looks for n nr of cells in house, which together has exactly n unique candidates.
              this means these candidates will go into these cells, and can be removed elsewhere in house.
           *
           * -- returns effectedCells - the updated cell(s), or false
           * -----------------------------------------------------------------*/
  let combineInfo: Array<{
    cell?: number
    candidates?: Array<number>
    candidate?: number
    cells?: Array<number>
  }> = []
  let minIndexes = [-1]
  function nakedCandidatesStrategy(number: number) {
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
            combinedCandidates as number[],
          )

          //if it does remove candidates, we're succeeded!
          if (cellsUpdated.length > 0) {
            //log("nakedCandidates: ");
            //log(combinedCandidates);

            onlyUpdatedCandidates = true
            //return cellsWithCandidates.concat(cellsUpdated);

            //return cells we actually update, duplicates removed
            return uniqueArray(cellsUpdated) as number[]
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

  /* nakedPairStrategy
   * --------------
   * see nakedCandidateElimination for explanation
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function nakedPairStrategy() {
    return nakedCandidatesStrategy(2)
  }

  /* nakedTripletStrategy
   * --------------
   * see nakedCandidateElimination for explanation
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function nakedTripletStrategy() {
    return nakedCandidatesStrategy(3)
  }

  /* nakedQuadrupleStrategy
   * --------------
   * see nakedCandidateElimination for explanation
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function nakedQuadrupleStrategy() {
    return nakedCandidatesStrategy(4)
  }

  /* hiddenLockedCandidates
           * --------------
           * looks for n nr of cells in house, which together has exactly n unique candidates.
              this means these candidates will go into these cells, and can be removed elsewhere in house.
           *
           * -- returns effectedCells - the updated cell(s), or false
           * -----------------------------------------------------------------*/
  function hiddenLockedCandidates(number: number) {
    function checkLockedCandidates(
      house: House,
      startIndex: number,
    ): ReturnType<StrategyFn> {
      //log("startIndex: "+startIndex);
      for (
        let i = Math.max(startIndex, minIndexes[startIndex]);
        i <= BOARD_SIZE - number + startIndex;
        i++
      ) {
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
            const cells = combineInfo[a].cells || []
            for (let b = 0; b < cells.length; b++) {
              if (!contains(temp, cells[b])) temp.push(cells[b] as number)
            }
          }
          if (temp.length > number) {
            //log("combined candidates spread over > n cells");
            continue //combined candidates spread over > n cells, won't work
          }
        }

        combineInfo.push({candidate, cells: possibleCells})

        if (startIndex < number - 1) {
          //still need to go deeper into combo
          const result = checkLockedCandidates(house, startIndex + 1)
          //when we come back, check if that's because we found answer.
          //if so, return with it, otherwise, keep looking
          if (result !== false) return result
        }
        //check if we match our pattern
        //if we have managed to combine n-1 candidates,
        //(we already know that cellsWithCandidates is <= n)
        //then we found a match!
        if (combineInfo.length === number) {
          //now we need to check whether this eliminates any candidates

          const combinedCandidates: Array<number> = [] //not unique now...
          let cellsWithCandidates: Array<CellValue> = [] //not unique either..
          for (let x = 0; x < combineInfo.length; x++) {
            const candidate = combineInfo[x].candidate
            if (candidate) {
              combinedCandidates.push(candidate)
            }
            cellsWithCandidates = [
              ...cellsWithCandidates,
              ...(combineInfo[x].cells || []),
            ]
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
            cellsWithCandidates as number[],
            candidatesToRemove,
          )

          //if it does remove candidates, we're succeeded!
          if (cellsUpdated.length > 0) {
            //log("hiddenLockedCandidates: ");
            //log(combinedCandidates);

            onlyUpdatedCandidates = true

            //filter out duplicates
            return uniqueArray(cellsWithCandidates as number[])
          }
        }
      }
      if (startIndex > 0) {
        //if we added a value to our combo check, but failed to find pattern, we now need drop that value and go back up in chain and continue to check..
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

        //checks every combo of n candidates in house, returns pattern, or false
        const result = checkLockedCandidates(house, 0)
        if (result !== false) return result
      }
    }
    return false //pattern not found
  }

  /* hiddenPairStrategy
   * --------------
   * see hiddenLockedCandidates for explanation
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function hiddenPairStrategy() {
    return hiddenLockedCandidates(2)
  }

  /* hiddenTripletStrategy
   * --------------
   * see hiddenLockedCandidates for explanation
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function hiddenTripletStrategy() {
    return hiddenLockedCandidates(3)
  }

  /* hiddenQuadrupleStrategy
   * --------------
   * see hiddenLockedCandidates for explanation
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function hiddenQuadrupleStrategy() {
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
    if (boardFinished) {
      if (!gradingMode) {
        boardFinishedFn?.(
          calculateBoardDifficulty(usedStrategies.filter(item => item > 0)),
        )
      }
      return
    }

    const effectedCells = strategies[strategyIndex].fn()

    if (effectedCells === false) {
      if (strategies.length > strategyIndex + 1) {
        return applySolvingStrategies(strategyIndex + 1)
      } else {
        if (typeof boardErrorFn === 'function' && !generatingMode) {
          boardErrorFn({message: 'no more strategies'})
        }
        return false
      }
    }

    if (boardError) {
      if (typeof boardErrorFn === 'function') {
        boardErrorFn({message: 'Board incorrect'})
      }
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
        boardFinished = true
        boardFinishedFn?.(
          calculateBoardDifficulty(usedStrategies.filter(item => item > 0)),
        )
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
    gradingMode = true
    solveMode = SOLVE_MODE_ALL

    const usedStrategiesClone = [...usedStrategies]
    const boardClone = JSON.parse(JSON.stringify(board))

    let canContinue
    do {
      const startStrategy = onlyUpdatedCandidates ? 2 : 0
      canContinue = applySolvingStrategies(startStrategy)
    } while (canContinue)

    const data: AnalyzeData = {
      error: '',
      finished: false,
      usedStrategies: [],
      level: DIFFICULTY_EASY,
      score: 0,
    }

    if (boardError) {
      data.error = 'Board incorrect'
    } else {
      data.finished = boardFinished
      data.usedStrategies = strategies
        .map((strategy, i) => {
          if (typeof usedStrategies[i] !== 'undefined') {
            return {
              title: strategy.title,
              freq: usedStrategies[i],
            }
          }
          return null
        })
        .filter(Boolean)

      if (boardFinished) {
        const boardDiff = calculateBoardDifficulty(
          usedStrategies.filter(item => item > 0),
        )
        data.level = boardDiff.level
        data.score = boardDiff.score
      }
    }

    resetBoardVariables()
    usedStrategies = usedStrategiesClone
    board = boardClone

    return data
  }
  const assignRandomCandidateToCell = (
    cellIndex: number,
    candidates: Array<number>,
  ) => {
    const randomIndex = Math.floor(Math.random() * candidates.length)
    const randomCandidate = candidates[randomIndex]

    setBoardCell(cellIndex, randomCandidate)
  }

  const setBoardCellWithRandomCandidate = (cellIndex: number) => {
    // CHECK still valid
    eliminateCandidatesVisually()
    // DRAW RANDOM CANDIDATE
    // don't draw already invalidated candidates for cell
    const invalids = invalidCandidates && invalidCandidates[cellIndex]
    // TODO: don't use JS filter - not supported enough(?)
    const candidates = board[cellIndex].candidates.filter(candidate => {
      if (!candidate || (invalids && contains(invalids, candidate)))
        return false
      return candidate
    }) as Array<number>
    // if cell has 0 candidates - fail to set cell.
    if (candidates.length === 0) {
      return false
    }
    assignRandomCandidateToCell(cellIndex, candidates)

    return true
  }

  const generateBoardAnswerRecursively = (cellIndex: number) => {
    if (cellIndex + 1 > BOARD_SIZE * BOARD_SIZE) {
      //done
      invalidCandidates = []
      return true
    }
    if (setBoardCellWithRandomCandidate(cellIndex)) {
      generateBoardAnswerRecursively(cellIndex + 1)
    } else {
      if (cellIndex <= 0) return false
      const lastIndex = cellIndex - 1
      invalidCandidates[lastIndex] = invalidCandidates[lastIndex] || []
      invalidCandidates[lastIndex].push(board[lastIndex].value)
      // set value back to null
      setBoardCell(lastIndex, null)
      // reset candidates, only in model.
      resetCandidates()
      // reset invalid candidates for cellIndex
      invalidCandidates[cellIndex] = []
      // then try again
      generateBoardAnswerRecursively(lastIndex)
      return false
    }
  }

  const isDifficultyLevelMet = (level: Difficulty): boolean => {
    switch (level) {
      case DIFFICULTY_EASY:
        return true
      case DIFFICULTY_MEDIUM:
        return difficulty !== DIFFICULTY_EASY
      case DIFFICULTY_HARD:
        return (
          difficulty !== DIFFICULTY_EASY && difficulty !== DIFFICULTY_MEDIUM
        )
      case DIFFICULTY_EXPERT:
        return (
          difficulty !== DIFFICULTY_EASY &&
          difficulty !== DIFFICULTY_MEDIUM &&
          difficulty !== DIFFICULTY_HARD
        )
      default:
        return false
    }
  }
  const isDifficultyAboveLevel = (level: Difficulty): boolean => {
    switch (difficulty) {
      case DIFFICULTY_EASY:
        return true
      case DIFFICULTY_MEDIUM:
        return level !== DIFFICULTY_EASY
      case DIFFICULTY_HARD:
        return level !== DIFFICULTY_EASY && level !== DIFFICULTY_MEDIUM
      case DIFFICULTY_EXPERT:
        return (
          level !== DIFFICULTY_EASY &&
          level !== DIFFICULTY_MEDIUM &&
          level !== DIFFICULTY_HARD
        )
      default:
        return false
    }
  }

  const prepareGameBoard = () => {
    const cells = Array.from({length: BOARD_SIZE * BOARD_SIZE}, (_, i) => i)
    let remainingCells = getRemainingCellsBasedOnDifficulty()

    while (cells.length > 0 && remainingCells > 0) {
      const randIndex = Math.floor(Math.random() * cells.length)
      const cellIndex = cells.splice(randIndex, 1)[0]
      const cellValue = board[cellIndex].value

      // Remove value from this cell
      setBoardCell(cellIndex, null)
      // Reset candidates, only in model.
      resetCandidates()

      const boardAnalysis = analyzeBoard()

      if (
        boardAnalysis.finished !== false &&
        isDifficultyLevelMet(boardAnalysis.level)
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
    generatingMode = true
    solveMode = SOLVE_MODE_ALL

    // the board generated will possibly not be hard enough
    // (if you asked for "hard", you most likely get "medium")
    generateBoardAnswerRecursively(0)

    // attempt one - save the answer, and try digging multiple times.
    const boardAnswer = board.slice()

    let boardTooEasy = true
    while (boardTooEasy) {
      prepareGameBoard()
      const data = analyzeBoard()
      if (isDifficultyAboveLevel(data.level)) boardTooEasy = false
      else board = boardAnswer
    }
    solveMode = SOLVE_MODE_STEP
    eliminateCandidatesVisually()
  }

  /*
   * init/API/events
   *-----------*/
  if (!initBoardData) {
    initializeBoard()
    generateBoard()
  } else {
    board = convertBoardToSerializedBoard(initBoardData)
    initializeBoard()
    eliminateCandidatesVisually()
    analyzeBoard()
  }

  /**
   * PUBLIC methods
   * ----------------- */
  const solveAll = () => {
    solveMode = SOLVE_MODE_ALL
    let canContinue: ReturnType<typeof applySolvingStrategies> = true
    while (canContinue) {
      const startStrategy = onlyUpdatedCandidates ? 2 : 0
      canContinue = applySolvingStrategies(startStrategy)
    }
  }

  const solveStep = () => {
    solveMode = SOLVE_MODE_STEP
    const startStrategy = onlyUpdatedCandidates ? 2 : 0
    applySolvingStrategies(startStrategy)
  }

  const getBoard = () => board.map(cell => cell.value)

  return {
    solveAll,
    solveStep,
    analyzeBoard,
    getBoard,
    generateBoard,
  }
}
