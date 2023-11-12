import {SudokuInstance} from './sudoku'

const {getBoard} = SudokuInstance({difficulty: 'expert'})

try {
  console.log(getBoard().map(cell => cell.value))
} catch (e) {
  console.log(e)
}
