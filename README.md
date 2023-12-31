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

![Downloads](https://img.shields.io/npm/dt/sudoku-core)
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

**gzipped size**: 3.2k

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

| function              | Input                                                | Output                  |
| --------------------- | ---------------------------------------------------- | ----------------------- |
| [generate](#generate) | "easy" \| "medium" \| "hard" \| "expert" \| "master" | Board                   |
| [solve](#solve)       | Board                                                | [SolvingResult](#solve) |
| [hint](#solveStep)    | Board                                                | [SolvingResult](#hint)  |
| [analyze](#analyze)   | Board                                                | [AnalyzeData](#analyze) |

board:

- it has numbers from 1-9 or null
- it has 81 cells
- it's solvable (not by brute force)
- there is only one version of answer to this board (not the process, the result)
  [1,null,9,5,8,null,null,6,3, ... 81 items]

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
const solvedBoard = solve(board);
console.log(solvedBoard);
```

```json
{
  "solved": true,
  "board": [
    2,
    7,
    6,
    3,
    8,
    1,
    9
    // ... 81 items
  ],
  "steps": [
    {
      "strategy": "Single Candidate Strategy",
      "updates": [{
        "index": 5,
        "filledValue": 1,
        "eliminatedCandidate": null,
      }],
      "type": "value"
    },
    ...steps
  ],
  "analysis": {
    "hasSolution": true,
    "hasUniqueSolution": true,
    "usedStrategies": [
      { "title": "Single Remaining Cell Strategy", "frequency": 21 },
      ...strategies
    ],
    "difficulty": "master",
    "score": 2232
  }
}
```

#### hint

- Solves the next step of the puzzle and return steps.

```typescript
const solvedBoard = hint(board);
console.log(solvedBoard);
```

```json
{
  "solved": true,
  "board": [
    null,
    7,
    6,
    null,
    null,
    1, // null => 1
    null
    // ... 81 items
  ],
  "steps": [
    {
      "strategy": "Single Candidate Strategy",
      "updates": [{
        "index": 5,
        "filledValue": 1,
        "eliminatedCandidate": null,
      }],
      "type": "value"
    }
  ],
  "analysis": {
    "hasSolution": true,
    "hasUniqueSolution": true,
    "usedStrategies": [
      { "title": "Single Remaining Cell Strategy", "frequency": 21 },
      ...strategies
    ],
    "difficulty": "master",
    "score": 2232
  }
}
```

#### analyze

- Returns an analysis of the current board state.

```typescript
const analyzeData = analyze(board);
console.log(analyzeData);
```

```json
{
  "hasSolution": true,
  "hasUniqueSolution": true,
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

## Project Stats

![Alt](https://repobeats.axiom.co/api/embed/0dbd157dd8d7156e22ce6e7f1d2b3f1dc3bd6d4d.svg "Repobeats analytics image")

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

- [Komeil Mehranfar](https://github.com/komeilmehranfar)
  - Frontend Engineer at [iO](https://iodigital.com)

## Acknowledgements

- [Komeil Mehranfar](https://github.com/komeilmehranfar/)

## References

- Inspired by [Jonas Ohlsson Aden](https://github.com/pocketjoso/sudokuJS)
