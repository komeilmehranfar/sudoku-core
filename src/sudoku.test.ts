import {createSudokuInstance} from './sudoku' // Import the createSudokuInstance module (update path as needed)

describe('createSudokuInstance', () => {
  describe('options', () => {
    describe('difficulty', () => {
      it('should generate a valid easy difficulty board', () => {
        //Arrange
        const sudoku = createSudokuInstance({difficulty: 'easy'})

        //Act
        const analyze = sudoku.analyzeBoard()

        // Assert
        expect(analyze.level).toBe('easy')
      })
      it('should generate a valid medium difficulty board', () => {
        //Arrange
        const sudoku = createSudokuInstance({difficulty: 'medium'})

        //Act
        const analyze = sudoku.analyzeBoard()

        // Assert
        expect(analyze.level).toBe('medium')
      })
      it('should generate a valid hard difficulty board', () => {
        //Arrange
        const sudoku = createSudokuInstance({difficulty: 'hard'})

        //Act
        const analyze = sudoku.analyzeBoard()

        // Assert
        expect(analyze.level).toBe('hard')
      })
      it('should generate a valid expert difficulty board', () => {
        //Arrange
        const sudoku = createSudokuInstance({difficulty: 'expert'})

        //Act
        const analyze = sudoku.analyzeBoard()

        // Assert
        expect(analyze.level).toBe('expert')
      })
    })
    describe('initialBoard', () => {
      it('should work with the board passed', () => {
        //Arrange
        const sudoku = createSudokuInstance({difficulty: 'hard'})
        const board = sudoku.getBoard()

        //Act
        const newSudoku = createSudokuInstance({initBoardData: board})

        // Assert
        const newAnalyze = newSudoku.analyzeBoard()
        const newBoard = newSudoku.getBoard()
        expect(newAnalyze.level).toBe('hard')
        expect(
          newBoard.every((newCell, index) => board[index] == newCell),
        ).toBe(true)
      })
    })
    describe('boardErrorFn', () => {
      it('should be called when passing invalid board', () => {
        //Arrange
        const invalidBoard = [1, 2, 3, 4]
        let errorMessage = ''
        const boardErrorFn = jest.fn(({message}) => {
          errorMessage = message
        })

        //Act
        createSudokuInstance({
          initBoardData: invalidBoard,
          boardErrorFn,
        })

        // Assert
        expect(boardErrorFn).toHaveBeenCalled()
      })
    })
    describe('boardUpdatedFn', () => {
      it('should be called when board is changed', () => {
        //Arrange
        let updatedData = {strategy: '', updatedCellsIndexes: []}
        const boardUpdatedFn = jest.fn(args => {
          updatedData = args
        })
        const {solveStep} = createSudokuInstance({
          boardUpdatedFn,
        })

        //Act
        solveStep()

        // Assert
        expect(boardUpdatedFn).toHaveBeenCalled()
        expect(
          typeof updatedData.strategy === 'string' &&
            updatedData.strategy.length > 0,
        ).toBe(true)
        // expect(errorMessage).toBe('no more strategies')
      })
    })
    describe('boardFinishedFn', () => {
      it('should be called when board is finished', () => {
        //Arrange
        const boardFinishedFn = jest.fn()
        const {solveAll} = createSudokuInstance({
          boardFinishedFn,
        })

        //Act
        solveAll()

        // Assert
        expect(boardFinishedFn).toHaveBeenCalled()
        // expect(errorMessage).toBe('no more strategies')
      })
      it('should not be called when board is analyzing', () => {
        //Arrange
        const boardFinishedFn = jest.fn()
        const {analyzeBoard} = createSudokuInstance({
          boardFinishedFn,
        })

        //Act
        analyzeBoard()

        // Assert
        expect(boardFinishedFn).not.toHaveBeenCalled()
      })
      it('should not be called when board is finished by solveStep', () => {
        //Arrange
        const boardFinishedFn = jest.fn()
        const {solveStep} = createSudokuInstance({
          difficulty: 'easy',
          boardFinishedFn,
        })

        //Act
        for (let index = 0; index < 81; index++) {
          solveStep()
        }

        // Assert
        expect(boardFinishedFn).toHaveBeenCalled()
      })
    })
    it('should be called when board is finished', () => {
      //Arrange
      let finishedData = {level: '', score: 0}
      const boardFinishedFn = jest.fn(args => {
        finishedData = args
      })
      const {solveAll} = createSudokuInstance({
        boardFinishedFn,
        difficulty: 'expert',
      })

      //Act
      solveAll()

      // Assert
      expect(boardFinishedFn).toHaveBeenCalled()
      expect(finishedData.level === 'expert').toBe(true)
      // expect(errorMessage).toBe('no more strategies')
    })
  })

  describe('getBoard method', () => {
    it('should return the board', () => {
      //Arrange
      const sudoku = createSudokuInstance({difficulty: 'expert'})

      //Act
      const board = sudoku.getBoard()

      // Assert
      expect(board.length === 81).toBe(true)
      board.forEach(cell => {
        expect(typeof cell === 'number' || cell == null).toBe(true)
      })
    })
  })
  describe('solveAll method', () => {
    it('should solve the board', () => {
      //Arrange
      const sudoku = createSudokuInstance({difficulty: 'expert'})

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
      const sudoku = createSudokuInstance({
        difficulty: 'expert',
        boardUpdatedFn({strategy, updatedCellsIndexes}) {
          console.log({strategy, updatedCellsIndexes})
        },
      })

      for (let index = 0; index < 81; index++) {
        //Arrange
        const boardBeforeLength = sudoku.getBoard().filter(Boolean).length

        //Act
        sudoku.solveStep()

        // Assert
        const boardAfterLength = sudoku.getBoard().filter(Boolean).length
        expect(
          boardAfterLength - boardBeforeLength === 1 ||
            boardBeforeLength === 81,
        ).toBe(true)
      }
    })
    it('should do nothing when called after solveAll', () => {
      //Arrange
      const sudoku = createSudokuInstance({difficulty: 'expert'})
      sudoku.solveAll()

      //Act
      sudoku.solveStep()

      // Assert
      const board = sudoku.getBoard()
      expect(board.filter(cell => cell !== null).length).toBe(81)
    })
  })
})
