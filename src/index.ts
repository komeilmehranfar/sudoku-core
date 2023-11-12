import {SudokuInstance} from './sudoku'

const {generateBoard, getBoard} = SudokuInstance()

try {
  generateBoard()
  console.log(getBoard())
} catch (e) {
  console.log(e)
}
