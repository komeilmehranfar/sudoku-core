// Importing necessary constants
import {
  DIFFICULTY_MEDIUM,
  SOLVE_MODE_STEP,
  SOLVE_MODE_ALL,
  BOARD_SIZE,
  CANDIDATES,
  NULL_CANDIDATE_LIST,
} from "./constants";

// Importing necessary types
import {
  Board,
  CellValue,
  InternalBoard,
  StrategyFn,
  Strategy,
  Options,
  House,
  AnalyzeData,
  SolveType,
} from "./types";

// Importing utility functions
import {
  addValueToCellIndex,
  calculateBoardDifficulty,
  contains,
  generateHouseIndexList,
  getRandomCandidateOfCell,
  getRemovalCountBasedOnDifficulty,
  isBoardFinished,
  isEasyEnough,
  isHardEnough,
  uniqueArray,
} from "./utils";

// Generating list of all houses (rows, columns, and boxes) in the sudoku board
const GROUP_OF_HOUSES = generateHouseIndexList(BOARD_SIZE);

// Function to create a new Sudoku instance
export function createSudokuInstance(options: Options = {}) {
  const {
    onError,
    onUpdate,
    onFinish,
    initBoard,
    difficulty = DIFFICULTY_MEDIUM,
  } = options;

  let board: InternalBoard = [];

  // Define a list to keep track of which strategies have been used to solve the board
  let usedStrategies: Array<number> = [];

  // Define different strategies to solve the Sudoku along with their scores
  const strategies: Array<Strategy> = [
    {
      title: "Single Remaining Cell Strategy",
      fn: singleRemainingCellStrategy,
      score: 0.1,
      postFn: updateCandidatesBasedOnCellsValue,
    },
    {
      title: "Single Candidate Cell Strategy",
      fn: singleCandidateCellStrategy,
      score: 9,
      postFn: updateCandidatesBasedOnCellsValue,
    },
    {
      title: "Single Candidate Value Strategy",
      fn: singleCandidateValueStrategy,
      score: 8,
      postFn: updateCandidatesBasedOnCellsValue,
    },
    {
      title: "Naked Pair Strategy",
      fn: nakedPairStrategy,
      score: 50,
    },
    {
      title: "Pointing Elimination Strategy",
      fn: pointingEliminationStrategy,
      score: 80,
    },
    //harder for human to spot
    {
      title: "Hidden Pair Strategy",
      fn: hiddenPairStrategy,
      score: 90,
    },
    {
      title: "Naked Triplet Strategy",
      fn: nakedTripletStrategy,
      score: 100,
    },
    //never gets used unless above strategies are turned off?
    {
      title: "Hidden Triplet Strategy",
      fn: hiddenTripletStrategy,
      score: 140,
    },
    //never gets used unless above strategies are turned off?
    {
      title: "Naked Quadruple Strategy",
      fn: nakedQuadrupleStrategy,
      score: 150,
    },
    //never gets used unless above strategies are turned off?
    {
      title: "Hidden Quadruple Strategy",
      fn: hiddenQuadrupleStrategy,
      score: 280,
    },
  ];

  // Function to initialize the Sudoku board
  const initializeBoard = () => {
    const alreadyEnhanced = board[0] !== null && typeof board[0] === "object";

    if (!alreadyEnhanced) {
      //enhance board to handle candidates, and possibly other params
      board = new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map((_, index) => {
        const value =
          typeof initBoard?.[index] === "undefined" ? null : initBoard[index];
        const candidates =
          value == null ? CANDIDATES.slice() : NULL_CANDIDATE_LIST.slice();
        return {
          value,
          candidates,
        };
      });
    }
  };

  // Function to remove certain candidates from multiple cells
  const removeCandidatesFromMultipleCells = (
    cells: Array<number>,
    candidates: Array<CellValue>,
  ) => {
    const cellsUpdated = [];
    for (let i = 0; i < cells.length; i++) {
      const c = board[cells[i]].candidates;

      for (let j = 0; j < candidates.length; j++) {
        const candidate = candidates[j];
        //-1 because candidate '1' is at index 0 etc.
        if (c[Number(candidate) - 1] !== null) {
          c[Number(candidate) - 1] = null; //NOTE: also deletes them from board variable
          cellsUpdated.push(cells[i]); //will push same cell multiple times
        }
      }
    }
    return cellsUpdated;
  };

  const resetBoardVariables = () => {
    usedStrategies = [];
  };

  // Function to reset the board variables
  const resetCandidates = () => {
    board = new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map((_, index) => ({
      ...board[index],
      candidates:
        board[index].value == null
          ? CANDIDATES.slice()
          : board[index].candidates,
    }));
  };

  /* indexInHouse
   * --------------
   *  returns index (0-9) for digit in house, false if not in house
   *  NOTE: careful evaluating returned index is IN row, as 0==false.
   * -----------------------------------------------------------------*/

  /* housesWithCell
   * --------------
   *  returns groupOfHouses that a cell belongs to
   * -----------------------------------------------------------------*/
  const housesWithCell = (cellIndex: number) => {
    const boxSideSize = Math.sqrt(BOARD_SIZE);
    const groupOfHouses = [];
    //horizontal row
    const horizontalRow = Math.floor(cellIndex / BOARD_SIZE);
    groupOfHouses.push(horizontalRow);
    //vertical row
    const verticalRow = Math.floor(cellIndex % BOARD_SIZE);
    groupOfHouses.push(verticalRow);
    //box
    const box =
      Math.floor(horizontalRow / boxSideSize) * boxSideSize +
      Math.floor(verticalRow / boxSideSize);
    groupOfHouses.push(box);

    return groupOfHouses;
  };

  /* getRemainingNumbers
   * --------------
   *  returns remaining numbers in a house after removing the used ones
   * -----------------------------------------------------------------*/
  const getRemainingNumbers = (house: House): Array<number> => {
    const usedNumbers = getUsedNumbers(house);

    return CANDIDATES.filter((candidate) => !usedNumbers.includes(candidate));
  };

  /* getUsedNumbers
   * --------------
   *  returns used numbers in a house
   * -----------------------------------------------------------------*/
  const getUsedNumbers = (house: House) => {
    // filter out cells that have values
    return house.map((cellIndex) => board[cellIndex].value).filter(Boolean);
  };

  /* getRemainingCandidates
   * --------------
   *  returns list of candidates for cell (with null's removed)
   * -----------------------------------------------------------------*/
  const getRemainingCandidates = (cellIndex: number): Array<CellValue> => {
    return board[cellIndex].candidates.filter(
      (candidate) => candidate !== null,
    );
  };

  /* getPossibleCellsForCandidate
   * --------------
   *  returns list of possible cells (cellIndex) for candidate (in a house)
   * -----------------------------------------------------------------*/
  const getPossibleCellsForCandidate = (candidate: number, house: House) => {
    return house.filter((cellIndex) =>
      board[cellIndex].candidates.includes(candidate),
    );
  };

  // Various strategies to solve the Sudoku are defined here

  /* singleRemainingCellStrategy
   * --------------
   * This is the simplest strategy. If there's only one empty cell in a row, column, or box (these are all "houses"), the number that goes into that cell has to be the one number that isn't elsewhere in that house.
   * For instance, if a row has the numbers 1 through 8, then the last cell in that row must be 9.
   * -----------------------------------------------------------------*/

  function singleRemainingCellStrategy(): ReturnType<StrategyFn> {
    const groupOfHouses = GROUP_OF_HOUSES;

    for (let i = 0; i < groupOfHouses.length; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const singleEmptyCell = findSingleEmptyCellInHouse(groupOfHouses[i][j]);

        if (singleEmptyCell) {
          return fillSingleEmptyCell(singleEmptyCell);
        }

        if (isBoardFinished(board)) {
          onFinish?.(calculateBoardDifficulty(usedStrategies, strategies));
          return true;
        }
      }
    }
    return false;
  }

  function findSingleEmptyCellInHouse(house: House) {
    const emptyCells = [];

    for (let k = 0; k < BOARD_SIZE; k++) {
      const boardIndex = house[k];
      if (board[boardIndex].value == null) {
        emptyCells.push({ house: house, cellIndex: boardIndex });
        if (emptyCells.length > 1) {
          break;
        }
      }
    }

    // If only one empty cell found
    return emptyCells.length === 1 ? emptyCells[0] : null;
  }

  function fillSingleEmptyCell(emptyCell: {
    house: number[];
    cellIndex: number;
  }) {
    const value = getRemainingNumbers(emptyCell.house);

    if (value.length > 1) {
      onError?.({ message: "Board Incorrect" });
      return -1;
    }

    board = addValueToCellIndex(board, emptyCell.cellIndex, value[0]); //does not update UI
    return [emptyCell.cellIndex];
  }

  /* updateCandidatesBasedOnCellsValue
  * --------------
  * ALWAYS returns false
  * -- special compared to other strategies: doesn't step - updates whole board,
  in one go. Since it also only updates candidates, we can skip straight to next strategy, since we know that neither this one nor the one(s) before (that only look at actual numbers on board), will find anything new.
  * -----------------------------------------------------------------*/
  function updateCandidatesBasedOnCellsValue() {
    const groupOfHousesLength = GROUP_OF_HOUSES.length;
    for (let i = 0; i < groupOfHousesLength; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const house = GROUP_OF_HOUSES[i][j];
        const candidatesToRemove = getUsedNumbers(house);
        for (let k = 0; k < BOARD_SIZE; k++) {
          const cellIndex = house[k];
          const cell = board[cellIndex];
          cell.candidates = cell.candidates.filter(
            (candidate) => !candidatesToRemove.includes(candidate),
          );
        }
      }
    }
    return false;
  }

  const convertInitialBoardToSerializedBoard = (
    _board: Board,
  ): InternalBoard => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map((_, i) => ({
      value: _board[i] || null,
      candidates:
        _board[i] == null ? CANDIDATES.slice() : NULL_CANDIDATE_LIST.slice(),
    }));
  };

  /* singleCandidateValueStrategy
   * --------------
   * This strategy looks at houses where a number only appears as a candidate in one cell.
   * If every other cell in a house already contains a number or can't possibly contain a certain number, then that number must go in the one cell where it's still a candidate.
   * For example, if in a row the number 3 can only be placed in the third cell, then it must go there.
   * -----------------------------------------------------------------*/
  function singleCandidateValueStrategy(): ReturnType<StrategyFn> {
    //log("visualElimination");
    //for each type of house..(hor row / vert row / box)
    const groupOfHousesLength = GROUP_OF_HOUSES.length;
    for (let i = 0; i < groupOfHousesLength; i++) {
      //for each such house
      for (let j = 0; j < BOARD_SIZE; j++) {
        const house = GROUP_OF_HOUSES[i][j];
        const digits = getRemainingNumbers(house);

        //for each digit left for that house
        for (let k = 0; k < digits.length; k++) {
          const digit = digits[k];
          const possibleCells = [];

          //for each cell in house
          for (let l = 0; l < BOARD_SIZE; l++) {
            const cell = house[l];
            const boardCell = board[cell];
            //if the digit only appears as a candidate in one slot, that's where it has to go
            if (contains(boardCell.candidates, digit)) {
              possibleCells.push(cell);
              if (possibleCells.length > 1) break; //no we can't tell anything in this case
            }
          }

          if (possibleCells.length === 1) {
            const cellIndex = possibleCells[0];

            //log("only slot where "+digit+" appears in house. ");

            board = addValueToCellIndex(board, cellIndex, digit); //does not update UI

            return [cellIndex]; //one step at the time
          }
        }
      }
    }
    return false;
  }

  /* singleCandidateCellStrategy
   * --------------
   * Looks for cells with only one candidate
   * -- returns effectedCells - the updated cell(s), or false
   * -----------------------------------------------------------------*/
  function singleCandidateCellStrategy(): ReturnType<StrategyFn> {
    //before we start with candidate strategies, we need to update candidates from last round:

    for (let i = 0; i < board.length; i++) {
      const cell = board[i];
      const candidates = cell.candidates;

      //for each candidate for that cell
      const possibleCandidates = [];
      for (let j = 0; j < candidates.length; j++) {
        if (candidates[j] !== null) possibleCandidates.push(candidates[j]);
        if (possibleCandidates.length > 1) break; //can't find answer here
      }
      if (possibleCandidates.length === 1) {
        const digit = possibleCandidates[0];

        //log("only one candidate in cell: "+digit+" in house. ");

        board = addValueToCellIndex(board, i, digit); //does not update UI

        return [i]; //one step at the time
      }
    }
    return false;
  }

  /* pointingEliminationStrategy
   * --------------
   * This strategy is used when a certain number appears only in a single row or column within a box. That means this number can be eliminated from the other cells in that row or column that are not in this box. For example, if in a box the number 4 only appears in the cells of the first row, then the number 4 can be removed from the rest of the cells in the first row that are not in this box.
   * -----------------------------------------------------------------*/
  function pointingEliminationStrategy() {
    //for each type of house..(hor row / vert row / box)
    const groupOfHousesLength = GROUP_OF_HOUSES.length;
    for (let a = 0; a < groupOfHousesLength; a++) {
      const houseType = a;

      for (let i = 0; i < BOARD_SIZE; i++) {
        const house = GROUP_OF_HOUSES[houseType][i];

        //for each digit left for this house
        const digits = getRemainingNumbers(house);
        for (let j = 0; j < digits.length; j++) {
          const digit = digits[j];
          //check if digit (candidate) only appears in one row (if checking boxes),
          //, or only in one box (if checking rows)

          let sameAltHouse = true; //row if checking box, and vice versa
          let houseId = -1;
          //when point checking from box, need to compare both kind of rows
          //that box cells are also part of, so use houseTwoId as well
          let houseTwoId = -1;
          let sameAltTwoHouse = true;
          const cellsWithCandidate = [];
          //let cellDistance = null;

          //for each cell
          for (let k = 0; k < house.length; k++) {
            const cell = house[k];

            if (contains(board[cell].candidates, digit)) {
              const cellHouses = housesWithCell(cell);
              const newHouseId =
                houseType === 2 ? cellHouses[0] : cellHouses[2];
              const newHouseTwoId =
                houseType === 2 ? cellHouses[1] : cellHouses[2];

              //if(cellsWithCandidate.length > 0){ //why twice the same?

              if (cellsWithCandidate.length > 0) {
                if (newHouseId !== houseId) {
                  sameAltHouse = false;
                }
                if (houseTwoId !== newHouseTwoId) {
                  sameAltTwoHouse = false;
                }
                if (sameAltHouse === false && sameAltTwoHouse === false) {
                  break; //not in same altHouse (box/row)
                }
              }
              //}
              houseId = newHouseId;
              houseTwoId = newHouseTwoId;
              cellsWithCandidate.push(cell);
            }
          }
          if (
            (sameAltHouse === true || sameAltTwoHouse === true) &&
            cellsWithCandidate.length > 0
          ) {
            //log("sameAltHouse..");
            //we still need to check that this actually eliminates something, i.e. these possible cells can't be only in house

            //first figure out what kind of house we are talking about..
            const h = housesWithCell(cellsWithCandidate[0]);
            let altHouseType = 2;
            if (houseType === 2) {
              if (sameAltHouse) altHouseType = 0;
              else altHouseType = 1;
            }

            const altHouse = GROUP_OF_HOUSES[altHouseType][h[altHouseType]];
            const cellsEffected = [];

            //log("groupOfHouses["+houseType+"]["+h[houseType]+"].length: "+groupOfHouses[houseType][h[houseType]].length);

            //need to remove cellsWithCandidate - from cells to remove from
            for (let x = 0; x < altHouse.length; x++) {
              if (!cellsWithCandidate.includes(altHouse[x])) {
                cellsEffected.push(altHouse[x]);
              }
            }
            //log("groupOfHouses["+houseType+"]["+h[houseType]+"].length: "+groupOfHouses[houseType][h[houseType]].length);

            //remove all candidates on altHouse, outside of house
            const cellsUpdated = removeCandidatesFromMultipleCells(
              cellsEffected,
              [digit],
            );

            if (cellsUpdated.length > 0) {
              // log("pointing: digit "+digit+", from houseType: "+houseType);

              //return cellsUpdated.concat(cellsWithCandidate);
              //only return cells where we actually update candidates
              return cellsUpdated;
            }
          }
        }
      }
    }
    return false;
  }

  /* nakedCandidatesStrategy
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function nakedCandidatesStrategy(number: number) {
    let combineInfo: Array<{
      cell: number;
      candidates: Array<CellValue>;
    }> = [];
    let minIndexes = [-1];
    //for each type of house..(hor row / vert row / box)
    const groupOfHousesLength = GROUP_OF_HOUSES.length;
    for (let i = 0; i < groupOfHousesLength; i++) {
      //for each such house
      for (let j = 0; j < BOARD_SIZE; j++) {
        //log("["+i+"]"+"["+j+"]");
        const house = GROUP_OF_HOUSES[i][j];
        if (getRemainingNumbers(house).length <= number)
          //can't eliminate any candidates
          continue;
        combineInfo = []; //{cell: x, candidates: []}, {} ..
        //combinedCandidates,cellsWithCandidate;
        minIndexes = [-1];
        //log("--------------");
        //log("house: ["+i+"]["+j+"]");

        //checks every combo of n candidates in house, returns pattern, or false
        const result = checkCombinedCandidates(house, 0);
        if (result !== false) return result;
      }
    }
    return false; //pattern not found

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
        minIndexes[startIndex] = i + 1;
        //or in a this loop deeper down in recursions
        minIndexes[startIndex + 1] = i + 1;

        //if(startIndex === 0){
        //	combinedCandidates = [];
        //	cellsWithCandidate = []; //reset
        //}
        const cell = house[i];
        const cellCandidates = getRemainingCandidates(cell);

        if (cellCandidates.length === 0 || cellCandidates.length > number)
          continue;

        //try adding this cell and it's cellCandidates,
        //but first need to check that that doesn't make (unique) amount of
        //candidates in combineInfo > n

        //if this is the first item we add, we don't need this check (above one is enough)
        if (combineInfo.length > 0) {
          const temp = cellCandidates.slice();
          for (let a = 0; a < combineInfo.length; a++) {
            const candidates = combineInfo[a].candidates || [];
            for (let b = 0; b < candidates.length; b++) {
              if (!contains(temp, candidates[b])) temp.push(candidates[b]);
            }
          }
          if (temp.length > number) {
            continue; //combined candidates spread over > n cells, won't work
          }
        }

        combineInfo.push({ cell, candidates: cellCandidates });

        if (startIndex < number - 1) {
          //still need to go deeper into combo
          const result = checkCombinedCandidates(house, startIndex + 1);
          //when we come back, check if that's because we found answer.
          //if so, return with it, otherwise, keep looking
          if (result !== false) return result;
        }

        //check if we match our pattern
        //if we have managed to combine n-1 cells,
        //(we already know that combinedCandidates is > n)
        //then we found a match!
        if (combineInfo.length === number) {
          //now we need to check whether this eliminates any candidates

          //now we need to check whether this eliminates any candidates

          const cellsWithCandidates = [];
          let combinedCandidates: Array<CellValue> = []; //not unique either..
          for (let x = 0; x < combineInfo.length; x++) {
            cellsWithCandidates.push(combineInfo[x].cell);
            combinedCandidates = combinedCandidates.concat(
              combineInfo[x].candidates || [],
            );
          }

          //get all cells in house EXCEPT cellsWithCandidates
          const cellsEffected = [];
          for (let y = 0; y < BOARD_SIZE; y++) {
            if (!contains(cellsWithCandidates, house[y])) {
              cellsEffected.push(house[y]);
            }
          }

          //remove all candidates on house, except the on cells matched in pattern
          const cellsUpdated = removeCandidatesFromMultipleCells(
            cellsEffected,
            combinedCandidates,
          );

          //if it does remove candidates, we're succeeded!
          if (cellsUpdated.length > 0) {
            //log("nakedCandidates: ");
            //log(combinedCandidates);

            //return cellsWithCandidates.concat(cellsUpdated);

            //return cells we actually update, duplicates removed
            return uniqueArray(cellsUpdated);
          }
        }
      }
      if (startIndex > 0) {
        //if we added a value to our combo check, but failed to find pattern, we now need drop that value and go back up in chain and continue to check..
        if (combineInfo.length > startIndex - 1) {
          //log("nakedCans: need to pop last added values..");
          combineInfo.pop();
        }
      }
      return false;
    }
  }

  /* nakedPairStrategy
   * --------------
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function nakedPairStrategy() {
    return nakedCandidatesStrategy(2);
  }

  /* nakedTripletStrategy
   * --------------
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function nakedTripletStrategy() {
    return nakedCandidatesStrategy(3);
  }

  /* nakedQuadrupleStrategy
   * --------------
   * These strategies look for a group of 2, 3, or 4 cells in the same house that between them have exactly 2, 3, or 4 candidates. Since those candidates have to go in some cell in that group, they can be eliminated as candidates from other cells in the house. For example, if in a column two cells can only contain the numbers 2 and 3, then in the rest of that column, 2 and 3 can be removed from the candidate lists.
   * -----------------------------------------------------------------*/
  function nakedQuadrupleStrategy() {
    return nakedCandidatesStrategy(4);
  }

  /* hiddenLockedCandidates
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function hiddenLockedCandidates(number: number) {
    let combineInfo: Array<{
      candidate: number;
      cells: Array<number>;
    }> = [];
    let minIndexes = [-1];
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
        minIndexes[startIndex] = i + 1;
        //or in a this loop deeper down in recursions
        minIndexes[startIndex + 1] = i + 1;

        const candidate = i + 1;
        //log(candidate);

        const possibleCells = getPossibleCellsForCandidate(candidate, house);

        if (possibleCells.length === 0 || possibleCells.length > number)
          continue;

        //try adding this candidate and it's possible cells,
        //but first need to check that that doesn't make (unique) amount of
        //possible cells in combineInfo > n
        if (combineInfo.length > 0) {
          const temp = possibleCells.slice();
          for (let a = 0; a < combineInfo.length; a++) {
            const cells = combineInfo[a].cells;
            for (let b = 0; b < cells.length; b++) {
              if (!contains(temp, cells[b])) temp.push(cells[b]);
            }
          }
          if (temp.length > number) {
            //log("combined candidates spread over > n cells");
            continue; //combined candidates spread over > n cells, won't work
          }
        }

        combineInfo.push({ candidate: candidate, cells: possibleCells });

        if (startIndex < number - 1) {
          //still need to go deeper into combo
          const r = checkLockedCandidates(house, startIndex + 1);
          //when we come back, check if that's because we found answer.
          //if so, return with it, otherwise, keep looking
          if (r !== false) return r;
        }
        //check if we match our pattern
        //if we have managed to combine n-1 candidates,
        //(we already know that cellsWithCandidates is <= n)
        //then we found a match!
        if (combineInfo.length === number) {
          //now we need to check whether this eliminates any candidates

          const combinedCandidates = []; //not unique now...
          let cellsWithCandidates: number[] = []; //not unique either..
          for (let x = 0; x < combineInfo.length; x++) {
            combinedCandidates.push(combineInfo[x].candidate);
            cellsWithCandidates = cellsWithCandidates.concat(
              combineInfo[x].cells,
            );
          }

          const candidatesToRemove = [];
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (!contains(combinedCandidates, c + 1))
              candidatesToRemove.push(c + 1);
          }
          //log("candidates to remove:")
          //log(candidatesToRemove);

          //remove all other candidates from cellsWithCandidates
          const cellsUpdated = removeCandidatesFromMultipleCells(
            cellsWithCandidates,
            candidatesToRemove,
          );

          //if it does remove candidates, we're succeeded!
          if (cellsUpdated.length > 0) {
            //log("hiddenLockedCandidates: ");
            //log(combinedCandidates);

            //filter out duplicates
            return uniqueArray(cellsWithCandidates);
          }
        }
      }
      if (startIndex > 0) {
        //if we added a value to our combo check, but failed to find pattern, we now need drop that value and go back up in chain and continue to check..
        if (combineInfo.length > startIndex - 1) {
          combineInfo.pop();
        }
      }
      return false;
    }
    //for each type of house..(hor row / vert row / box)
    const groupOfHousesLength = GROUP_OF_HOUSES.length;
    for (let i = 0; i < groupOfHousesLength; i++) {
      //for each such house
      for (let j = 0; j < BOARD_SIZE; j++) {
        const house = GROUP_OF_HOUSES[i][j];
        if (getRemainingNumbers(house).length <= number)
          //can't eliminate any candidates
          continue;
        combineInfo = [];
        minIndexes = [-1];

        //checks every combo of n candidates in house, returns pattern, or false
        const result = checkLockedCandidates(house, 0);
        if (result !== false) return result;
      }
    }
    return false; //pattern not found
  }

  /* hiddenPairStrategy
   * --------------
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function hiddenPairStrategy() {
    return hiddenLockedCandidates(2);
  }

  /* hiddenTripletStrategy
   * --------------
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function hiddenTripletStrategy() {
    return hiddenLockedCandidates(3);
  }

  /* hiddenQuadrupleStrategy
   * --------------
   * These strategies are similar to the naked ones, but instead of looking for cells that only contain the group of candidates, they look for candidates that only appear in the group of cells. For example, if in a box, the numbers 2 and 3 only appear in two cells, then even if those cells have other candidates, you know that one of them has to be 2 and the other has to be 3, so you can remove any other candidates from those cells.
   * -----------------------------------------------------------------*/
  function hiddenQuadrupleStrategy() {
    return hiddenLockedCandidates(4);
  }

  // Function to apply the solving strategies in order
  const applySolvingStrategies = ({
    strategyIndex = 0,
    gradingMode = false,
    solveMode = SOLVE_MODE_ALL,
  }: {
    strategyIndex?: number;
    gradingMode?: boolean;
    solveMode?: SolveType;
  } = {}): boolean | undefined => {
    if (isBoardFinished(board)) {
      if (!gradingMode) {
        onFinish?.(calculateBoardDifficulty(usedStrategies, strategies));
      }
      return false;
    }

    const effectedCells = strategies[strategyIndex].fn();
    strategies[strategyIndex].postFn?.();

    if (effectedCells === false) {
      if (strategies.length > strategyIndex + 1) {
        return applySolvingStrategies({
          strategyIndex: strategyIndex + 1,
          gradingMode,
          solveMode,
        });
      } else {
        onError?.({ message: "No More Strategies To Solve The Board" });
        return false;
      }
    }
    if (effectedCells === -1) {
      return false;
    }

    if (solveMode === SOLVE_MODE_STEP) {
      if (typeof onUpdate === "function") {
        onUpdate({
          strategy: strategies[strategyIndex].title,
          updatedIndexes: effectedCells as Array<number>,
        });
      }

      if (isBoardFinished(board)) {
        onFinish?.(calculateBoardDifficulty(usedStrategies, strategies));
      }
    }

    if (typeof usedStrategies[strategyIndex] === "undefined") {
      usedStrategies[strategyIndex] = 0;
    }

    usedStrategies[strategyIndex] += 1;

    return true;
  };

  const setBoardCellWithRandomCandidate = (cellIndex: number) => {
    updateCandidatesBasedOnCellsValue();
    const invalids = board[cellIndex].invalidCandidates || [];
    const candidates = board[cellIndex].candidates.filter(
      (candidate) => Boolean(candidate) && !invalids.includes(candidate),
    );
    if (candidates.length === 0) {
      return false;
    }
    const value = getRandomCandidateOfCell(candidates);
    board = addValueToCellIndex(board, cellIndex, value);
    return true;
  };

  const invalidPreviousCandidateAndStartOver = (cellIndex: number) => {
    const previousIndex = cellIndex - 1;
    board[previousIndex].invalidCandidates =
      board[previousIndex].invalidCandidates || [];

    board[previousIndex].invalidCandidates?.push(board[previousIndex].value);

    board = addValueToCellIndex(board, previousIndex, null);
    resetCandidates();
    board[cellIndex].invalidCandidates = [];

    generateBoardAnswerRecursively(previousIndex);
  };
  const generateBoardAnswerRecursively = (cellIndex: number) => {
    if (cellIndex + 1 > BOARD_SIZE * BOARD_SIZE) {
      board.forEach((cell) => (cell.invalidCandidates = []));
      return true;
    }
    if (setBoardCellWithRandomCandidate(cellIndex)) {
      generateBoardAnswerRecursively(cellIndex + 1);
    } else {
      invalidPreviousCandidateAndStartOver(cellIndex);
    }
  };

  // Function to prepare the game board
  const prepareGameBoard = () => {
    const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i);
    let removalCount = getRemovalCountBasedOnDifficulty(difficulty);
    while (removalCount > 0 && cells.length > 0) {
      const randIndex = Math.round(Math.random() * (cells.length - 1));
      const [cellIndex] = cells.splice(randIndex, 1);
      const cellValue = board[cellIndex].value;

      // Remove value from this cell
      board = addValueToCellIndex(board, cellIndex, null);
      // Reset candidates, only in model.
      resetCandidates();

      const boardAnalysis = analyzeBoard();
      if (
        boardAnalysis.isValid &&
        boardAnalysis.difficulty &&
        isEasyEnough(difficulty, boardAnalysis.difficulty)
      ) {
        removalCount--;
      } else {
        // Reset - don't dig this cell
        board = addValueToCellIndex(board, cellIndex, cellValue);
      }
    }
  };

  // Initialization and public methods

  // Function to analyze the current state of the board
  function analyzeBoard() {
    const usedStrategiesClone = [...usedStrategies];
    const boardClone = JSON.parse(JSON.stringify(board));

    let canContinue: boolean | undefined = true;
    do {
      canContinue = applySolvingStrategies({
        gradingMode: true,
        solveMode: SOLVE_MODE_ALL,
      });
    } while (canContinue);

    const data: AnalyzeData = {
      isValid: isBoardFinished(board),
      usedStrategies: strategies
        .map((strategy, i) => {
          if (typeof usedStrategies[i] !== "undefined") {
            return {
              title: strategy.title,
              freq: usedStrategies[i],
            };
          }
          return null;
        })
        .filter(Boolean),
    };

    if (isBoardFinished(board)) {
      const boardDiff = calculateBoardDifficulty(usedStrategies, strategies);
      data.difficulty = boardDiff.difficulty;
      data.score = boardDiff.score;
    }

    resetBoardVariables();
    usedStrategies = usedStrategiesClone;
    board = boardClone;

    return data;
  }

  // Function to generate the Sudoku board
  function generateBoard(): Board {
    generateBoardAnswerRecursively(0);

    // attempt one - save the answer, and try digging multiple times.
    const boardAnswer = board.slice();

    let boardTooEasy = true;
    while (boardTooEasy) {
      prepareGameBoard();
      const data = analyzeBoard();
      if (data.difficulty && isHardEnough(difficulty, data.difficulty)) {
        boardTooEasy = false;
      } else {
        board = boardAnswer;
      }
    }
    updateCandidatesBasedOnCellsValue();
    return getBoard();
  }

  const solveAll = (): Board => {
    let canContinue: boolean | undefined = true;
    while (canContinue) {
      canContinue = applySolvingStrategies({ solveMode: SOLVE_MODE_ALL });
    }
    return getBoard();
  };

  const solveStep = (): Board => {
    const _board = getBoard().slice();
    applySolvingStrategies({ solveMode: SOLVE_MODE_STEP });
    if (
      !isBoardFinished(board) &&
      _board.filter(Boolean).length ===
        getBoard().slice().filter(Boolean).length
    ) {
      solveStep();
    }
    return getBoard();
  };

  const getBoard = (): Board => board.map((cell) => cell.value);

  if (!initBoard) {
    initializeBoard();
    generateBoard();
  } else {
    board = convertInitialBoardToSerializedBoard(initBoard);
    initializeBoard();
    updateCandidatesBasedOnCellsValue();
    analyzeBoard();
  }

  return {
    solveAll,
    solveStep,
    analyzeBoard,
    getBoard,
    generateBoard,
  };
}
