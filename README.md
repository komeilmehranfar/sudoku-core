A typescript Sudoku package for generating, solving (step-by-step or all), and analyzing Sudoku boards with ease. Perfect for building Sudoku games and integrating Sudoku functionality into your applications.
<br/>

<p align="center">
  <a href="https://github.com/komeilmehranfar/sudoku-core">
    <img src="/assets/sudoku-core.png" alt="Logo" width="320" height="180">
  </a>

  <h3 align="center">Sudoku Solver and Generator Javascript</h3>

  <p align="center"> 
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

![npm](https://img.shields.io/npm/dt/sudoku-core)
![Contributors](https://img.shields.io/github/contributors/komeilmehranfar/sudoku-core?color=dark-green)
![Forks](https://img.shields.io/github/forks/komeilmehranfar/sudoku-core?style=social)
![Stargazers](https://img.shields.io/github/stars/komeilmehranfar/sudoku-core?style=social)
![Issues](https://img.shields.io/github/issues/komeilmehranfar/sudoku-core)
![License](https://img.shields.io/github/license/komeilmehranfar/sudoku-core)

## Table Of Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Inputs](#inputs)
  - [Methods](#methods)
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

| function                | Input                                                | Output                  |
| ----------------------- | ---------------------------------------------------- | ----------------------- |
| [generate](#generate)   | "easy" \| "medium" \| "hard" \| "expert" \| "master" | Board                   |
| [solve](#solve)         | Board                                                | Board                   |
| [solveStep](#solveStep) | Board                                                | Board                   |
| [analyze](#analyze)     | Board                                                | [AnalyzeData](#analyze) |

#### generate

- Generates a new Sudoku puzzle.

```typescript
// difficulty: easy - medium - hard - expert - master;
const board = generate("easy");
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

#### solve

- Solves the entire puzzle.

```typescript
// board:
// - it has numbers from 1-9 or null
// - it has 81 cells
// - it's solvable (not by brute force)
// - there is only one version of answer to this board (not the process, the result)
// [
//   1,
//   null,
//   9,
//   5,
//   8,
//   null,
//   null,
//   6,
//   3
//   ... 81 items
// ]
const solvedBoard = solve(board);
console.log(solvedBoard);
```

```json
[
  5, 3, 4, 7, 9, 8, 2, 1
  //... 81 items
]
```

#### solveStep

- Solves the next step of the puzzle.

```typescript
// board:
// - it has numbers from 1-9 or null
// - it has 81 cells
// - it's solvable (not by brute force)
// - there is only one version of answer to this board (not the process, the result)
// [
//   1,
//   null,
//   9,
//   5,
//   8,
//   null,
//   null,
//   6,
//   3
//   ... 81 items
// ]
const solvedBoard = solveStep(board);
console.log(solvedBoard);
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

#### analyze

- Returns an analysis of the current board state.

```typescript
// board:
// - it has numbers from 1-9 or null
// - it has 81 cells
// - it's solvable (not by brute force)
// - there is only one version of answer to this board (not the process, the result)
// [
//   1,
//   null,
//   9,
//   5,
//   8,
//   null,
//   null,
//   6,
//   3
//   ... 81 items
// ]
const analyzeData = analyze(board);
console.log(analyzeData);
```

```json
{
  "isValid": true,
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
[LICENSE](https://github.com/komeilmehranfar/sudoku-core/blob/main/LICENSE)
for more information.

## Authors

- [Komeil Mehranfar](https://github.com/komeilmehranfar) - Frontend Engineer at
  [iO](https://iodigital.com)

## Acknowledgements

- [Komeil Mehranfar](https://github.com/komeilmehranfar/)

## References

- Inspired by [Jonas Ohlsson Aden](https://github.com/pocketjoso/sudokuJS)
