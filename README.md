A typescript Sudoku package for generating, solving (step-by-step or all), and analyzing Sudoku boards with ease. Perfect for building Sudoku games and integrating Sudoku functionality into your applications.
<br/>

<p align="center">
  <a href="https://github.com/komeilmehranfar/sudoku-core">
    <img src="/assets/sudoku-core.png" alt="Logo" width="320" height="180">
  </a>

  <h3 align="center">Sudoku Core Function</h3>

  <p align="center">
    Generate, Solve (step-by-step or all), Analyze Sudoku boards 
    <br/>
    <br/>
    <a href="https://github.com/komeilmehranfar/sudoku-core"><strong>Explore the docs »</strong></a>
    <br/>
    <br/>
    <a href="https://codesandbox.io/s/cold-fast-vvrf2d?file=/src/index.ts">View Demo</a>
    .
    <a href="https://github.com/komeilmehranfar/sudoku-core/issues">Report Bug</a>
    .
    <a href="https://github.com/komeilmehranfar/sudoku-core/issues">Request Feature</a>
  </p>
</p>

![Downloads](https://img.shields.io/github/downloads/komeilmehranfar/sudoku-core/total)
![Contributors](https://img.shields.io/github/contributors/komeilmehranfar/sudoku-core?color=dark-green)
![Forks](https://img.shields.io/github/forks/komeilmehranfar/sudoku-core?style=social)
![Stargazers](https://img.shields.io/github/stars/komeilmehranfar/sudoku-core?style=social)
![Issues](https://img.shields.io/github/issues/komeilmehranfar/sudoku-core)
![License](https://img.shields.io/github/license/komeilmehranfar/sudoku-core)

## Table Of Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)
- [Acknowledgements](#acknowledgements)

## About the package

**Key Features**:

**Board Generation**: Quickly create Sudoku boards for various difficulty levels.

**Solver**: Solve Sudoku puzzles.

**Step-by-Step Solution**: Walk through the solution process step by step, making it ideal for educational purposes or enhancing user engagement in Sudoku apps.

**Board Analysis**: Analyze the difficulty and strategies to solve a sudoku board.

## Getting Started

### Installation

```sh
npm install sudoku-core@latest
```

### Usage

```javascript
import { createSudokuInstance } from "sudoku-core";
```

#### Generate Board

```javascript
// Need to create a Sudoku Instance first
const { getBoard } = createSudokuInstance({ difficulty: "easy" });

// get the generated board
const board = getBoard();
console.log(board);
```

**Output (board)**

```json
[
  5,
  3,
  null,
  null,
  null,
  null,
  null,
  1
  //... 81 items
]
```

#### Analyze Board

```javascript
// Need to create a Sudoku Instance first
const { analyze } = createSudokuInstance({ difficulty: "expert" });

// get the generated board
const analyzeData = analyze();
console.log(analyzeData);
```

**Output**

```json
{
  "finished": true,
  "usedStrategies": [
    { "title": "Single Remaining Cell Strategy", "frequency": 21 },
    { "title": "Single Candidate Cell Strategy", "frequency": 11 },
    { "title": "Single Candidate Value Strategy", "frequency": 29 },
    { "title": "Pointing Elimination Strategy", "frequency": 27 }
  ],
  "level": "expert",
  "score": 1683.1
}
```

_For more examples, please refer to the [API](#API)_

## API Usage

**createSudokuInstance**

```javascript
import { createSudokuInstance } from "sudoku-core";

const sudoku = createSudokuInstance(options);
```

The createSudokuInstance function generates a new Sudoku puzzle. It accepts an optional options object and returns a Sudoku instance with several methods.

### Options

**onError**: A function that is called when an error occurs. The error message is passed as an argument.

```typescript
function onError({ message }: { message: string }) {
  console.log(message);
}
const sudoku = createSudokuInstance({ onError });
```

**onUpdate**: A function that is called whenever there's an update in the board. The update info is passed as an argument. It will be called when you use **solveStep** method.

```typescript
function onUpdate(data: { strategy: string; updatedIndexes: Array<number> }) {
  console.log(data); // {strategy: "Single Remaining Cell Strategy", updatedIndexes: [1,2,3]}
}
const sudoku = createSudokuInstance({ onUpdate });
```

**onFinish**: A function that is called when the board is completely solved. The difficulty of the board is passed as an argument.

```typescript
function onFinish(data: {
  difficulty: "easy" | "medium" | "hard" | "expert";
  score: number;
}) {
  console.log(data); // { difficulty: "medium", score: 140.5 }
}
const sudoku = createSudokuInstance({ onFinish });
```

**initBoard**: A predefined board data to start with. If not provided, a new board is generated.
**It should be a valid sudoku board.**

```typescript
const initBoard = [
  1,
  3,
  6,
  null,
  null,
  5,
  8,
  null,
  null,
  // other cells
]; //
const sudoku = createSudokuInstance({ initBoard });
```

Valid sudoku board means:

- it has 81 cells
- it's solvable (not by brute force)
- there is only one version of answer to this board (not the process, the result)

**difficulty**: The difficulty level of the Sudoku. It is one of **easy**, **medium**, **hard**, and **expert**.

### Methods

**solveAll**: Solves the entire puzzle.

```typescript
const { solveAll } = createSudokuInstance({ difficulty: "easy" });
const board = solveAll();
console.log(board);
```

```json
[
  5, 3, 4, 7, 9, 8, 2, 1
  //... 81 items
]
```

**solveStep**: Solves the next step of the puzzle.

```typescript
const { solveStep } = createSudokuInstance({ difficulty: "easy" });
const board = solveStep();
console.log(board);
```

```json
[
  1,
  3,
  6,
  null,
  9, // => it was null
  5,
  8,
  null,
  null
  //... 81 items
]
```

**analyzeBoard**: Returns an analysis of the current board state.

```typescript
const { analyzeBoard } = createSudokuInstance({ difficulty: "expert" });
const analyzeData = analyzeBoard();
console.log(analyzeData);
```

```json
{
  "finished": true,
  "usedStrategies": [
    { "title": "Single Remaining Cell Strategy", "frequency": 21 },
    { "title": "Single Candidate Cell Strategy", "frequency": 11 },
    { "title": "Single Candidate Value Strategy", "frequency": 29 },
    { "title": "Pointing Elimination Strategy", "frequency": 27 }
  ],
  "level": "expert",
  "score": 1683.1
}
```

**getBoard**: Returns the current state of the Sudoku board.

```typescript
const { getBoard } = createSudokuInstance({ difficulty: "easy" });
const board = getBoard();
console.log(board);
```

```json
[
  1,
  3,
  6,
  null,
  9,
  5,
  8,
  null,
  null
  //... 81 items
]
```

**generateBoard**: Generates a new Sudoku puzzle.

```typescript
const { generateBoard } = createSudokuInstance({ difficulty: "easy" });
const board = generateBoard(); // generate new board with the same difficulty
console.log(board);
```

```json
[
  1,
  null,
  9,
  5,
  8,
  null,
  null,
  6,
  3
  //... 81 items
]
```

## Roadmap

See the [open issues](https://github.com/komeilmehranfar/sudoku-core/issues) for
a list of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to
be learn, inspire, and create. Any contributions you make are **greatly
appreciated**.

- If you have suggestions for adding or removing projects, feel free to
  [open an issue](https://github.com/komeilmehranfar/sudoku-core/issues/new) to
  discuss it, or directly create a pull request after you edit the _README.md_
  file with necessary changes.
- Please make sure you check your spelling and grammar.
- Create individual PR for each suggestion.

### Creating A Pull Request

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See
[LICENSE](https://github.com/komeilmehranfar/sudoku-core/blob/main/LICENSE.md)
for more information.

## Authors

- [Komeil Mehranfar](https://github.com/komeilmehranfar) - Frontend Engineer at
  [iO](https://iodigital.com)

## Acknowledgements

- [Komeil Mehranfar](https://github.com/komeilmehranfar/)
