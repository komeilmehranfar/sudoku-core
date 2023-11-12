import {SudokuInstance} from './sudoku' // Import the SudokuInstance module (update path as needed)

describe('SudokuInstance', () => {
  describe('generateBoard method', () => {
    it('should generate a valid easy difficulty board', () => {
      //Arrange
      const sudoku = SudokuInstance({difficulty: 'easy'})

      //Act
      const analyze = sudoku.analyzeBoard()

      // Assert
      expect(analyze.level).toBe('easy')
    })
    it('should generate a valid medium difficulty board', () => {
      //Arrange
      const sudoku = SudokuInstance({difficulty: 'medium'})

      //Act
      const analyze = sudoku.analyzeBoard()

      // Assert
      expect(analyze.level).toBe('medium')
    })
    it('should generate a valid hard difficulty board', () => {
      //Arrange
      const sudoku = SudokuInstance({difficulty: 'hard'})

      //Act
      const analyze = sudoku.analyzeBoard()

      // Assert
      expect(analyze.level).toBe('hard')
    })
    it('should generate a valid expert difficulty board', () => {
      //Arrange
      const sudoku = SudokuInstance({difficulty: 'expert'})

      //Act
      const analyze = sudoku.analyzeBoard()

      // Assert
      expect(analyze.level).toBe('expert')
    })
  })
  describe('solveAll method', () => {
    it('should solve the board', () => {
      //Arrange
      const sudoku = SudokuInstance({difficulty: 'expert'})

      //Act
      sudoku.solveAll()

      // Assert
      const board = sudoku.getBoard()
      expect(board.every(cell => cell !== null)).toBe(true)
    })
  })
  describe('solveStep method', () => {
    it('should solve one more step', () => {
      //Arrange
      const sudoku = SudokuInstance({difficulty: 'expert'})
      const boardBefore = sudoku.getBoard()

      //Act
      sudoku.solveStep()

      // Assert
      const boardAfter = sudoku.getBoard()
      expect(
        boardAfter.filter(cell => cell !== null).length -
          boardBefore.filter(cell => cell !== null).length,
      ).toBe(1)
    })
    it('should do nothing', () => {
      //Arrange
      const sudoku = SudokuInstance({difficulty: 'expert'})
      sudoku.solveAll()

      //Act
      sudoku.solveStep()

      // Assert
      const board = sudoku.getBoard()
      expect(board.filter(cell => cell !== null).length).toBe(81)
    })
  })
})
