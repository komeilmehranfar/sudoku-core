import {
  BOARD_SIZE,
  DIFFICULTY_EASY,
  DIFFICULTY_EXPERT,
  DIFFICULTY_HARD,
  DIFFICULTY_MASTER,
  DIFFICULTY_MEDIUM,
  NULL_CANDIDATE_LIST,
} from "./constants";
import {
  CellValue,
  Difficulty,
  Houses,
  InternalBoard,
  Strategy,
} from "./types";

//array contains function
export const contains = (array: Array<unknown>, object: unknown) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === object) {
      return true;
    }
  }
  return false;
};

export const uniqueArray = (array: Array<number>): Array<number> => {
  const temp: Record<number, unknown> = {};
  for (let i = 0; i < array.length; i++) temp[array[i]] = true;
  const record: number[] = [];
  for (const k in temp) record.push(Number(k));
  return record;
};

/* generateHouseIndexList
 * -----------------------------------------------------------------*/
export const generateHouseIndexList = (boardSize: number): Houses[] => {
  const groupOfHouses: Houses[] = [[], [], []];
  const boxSideSize = Math.sqrt(boardSize);
  for (let i = 0; i < boardSize; i++) {
    const horizontalRow = []; //horizontal row
    const verticalRow = []; //vertical row
    const box = [];
    for (let j = 0; j < boardSize; j++) {
      horizontalRow.push(boardSize * i + j);
      verticalRow.push(boardSize * j + i);

      if (j < boxSideSize) {
        for (let k = 0; k < boxSideSize; k++) {
          const a = Math.floor(i / boxSideSize) * boardSize * boxSideSize;
          const b = (i % boxSideSize) * boxSideSize;
          const boxStartIndex = a + b; //0 3 6 27 30 33 54 57 60

          box.push(boxStartIndex + boardSize * j + k);
        }
      }
    }
    groupOfHouses[0].push(horizontalRow);
    groupOfHouses[1].push(verticalRow);
    groupOfHouses[2].push(box);
  }
  return groupOfHouses;
};

export const isBoardFinished = (board: InternalBoard): boolean => {
  return new Array(BOARD_SIZE * BOARD_SIZE)
    .fill(null)
    .every((_, i) => board[i].value !== null);
};

export const isEasyEnough = (
  difficulty: Difficulty,
  currentDifficulty: Difficulty,
): boolean => {
  switch (currentDifficulty) {
    case DIFFICULTY_EASY:
      return true;
    case DIFFICULTY_MEDIUM:
      return difficulty !== DIFFICULTY_EASY;
    case DIFFICULTY_HARD:
      return difficulty !== DIFFICULTY_EASY && difficulty !== DIFFICULTY_MEDIUM;
    case DIFFICULTY_EXPERT:
      return (
        difficulty !== DIFFICULTY_EASY &&
        difficulty !== DIFFICULTY_MEDIUM &&
        difficulty !== DIFFICULTY_HARD
      );
    case DIFFICULTY_MASTER:
      return (
        difficulty !== DIFFICULTY_EASY &&
        difficulty !== DIFFICULTY_MEDIUM &&
        difficulty !== DIFFICULTY_HARD &&
        difficulty !== DIFFICULTY_EXPERT
      );
  }
};
export const isHardEnough = (
  difficulty: Difficulty,
  currentDifficulty: Difficulty,
): boolean => {
  switch (difficulty) {
    case DIFFICULTY_EASY:
      return true;
    case DIFFICULTY_MEDIUM:
      return currentDifficulty !== DIFFICULTY_EASY;
    case DIFFICULTY_HARD:
      return (
        currentDifficulty !== DIFFICULTY_EASY &&
        currentDifficulty !== DIFFICULTY_MEDIUM
      );
    case DIFFICULTY_EXPERT:
      return (
        currentDifficulty !== DIFFICULTY_EASY &&
        currentDifficulty !== DIFFICULTY_MEDIUM &&
        currentDifficulty !== DIFFICULTY_HARD
      );
    case DIFFICULTY_MASTER:
      return (
        currentDifficulty !== DIFFICULTY_EASY &&
        currentDifficulty !== DIFFICULTY_MEDIUM &&
        currentDifficulty !== DIFFICULTY_HARD &&
        currentDifficulty !== DIFFICULTY_EXPERT
      );
  }
};

export const getRemovalCountBasedOnDifficulty = (difficulty: Difficulty) => {
  switch (difficulty) {
    case DIFFICULTY_EASY:
      return BOARD_SIZE * BOARD_SIZE - 40;
    case DIFFICULTY_MEDIUM:
      return BOARD_SIZE * BOARD_SIZE - 30;
    default:
      return BOARD_SIZE * BOARD_SIZE - 17;
  }
};

/* addValueToCellIndex - does not update UI
          -----------------------------------------------------------------*/
export const addValueToCellIndex = (
  board: InternalBoard,
  cellIndex: number,
  value: CellValue,
): InternalBoard => {
  return board.map((cell, index) =>
    cellIndex === index
      ? {
          ...cell,
          value: value,
          candidates:
            value !== null
              ? NULL_CANDIDATE_LIST.slice()
              : cell.candidates.slice(),
        }
      : { ...cell, candidates: cell.candidates.slice() },
  );
};

export const getRandomCandidateOfCell = (candidates: Array<CellValue>) => {
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
};

/* calculateBoardDifficulty
 * --------------
 *  TYPE: solely based on strategies required to solve board (i.e. single count per strategy)
 *  SCORE: distinguish between boards of same difficulty.. based on point system. Needs work.
 * -----------------------------------------------------------------*/
export const calculateBoardDifficulty = (
  usedStrategies: Array<number>,
  strategies: Array<Strategy>,
): { difficulty: Difficulty; score: number } => {
  const validUsedStrategies = usedStrategies.filter(Boolean);
  const totalScore = validUsedStrategies.reduce(
    (accumulatedScore, frequency, i) => {
      const strategy = strategies[i];
      return accumulatedScore + frequency * strategy.score;
    },
    0,
  );
  let difficulty: Difficulty =
    validUsedStrategies.length < 3
      ? DIFFICULTY_EASY
      : validUsedStrategies.length < 4
        ? DIFFICULTY_MEDIUM
        : DIFFICULTY_HARD;

  if (totalScore > 750) difficulty = DIFFICULTY_EXPERT;
  if (totalScore > 2000) difficulty = DIFFICULTY_MASTER;

  return {
    difficulty,
    score: totalScore,
  };
};
