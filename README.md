<br/>
<p align="center">
  <a href="https://github.com/komeilmehranfar/sudoku-core">
    <img src="/assets/sudoku-core.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Sudoku Core Function</h3>

  <p align="center">
    Generate, Solve (step-by-step or all), Analyze Sudoku boards 
    <br/>
    <br/>
    <a href="https://github.com/komeilmehranfar/sudoku-core"><strong>Explore the docs »</strong></a>
    <br/>
    <br/>
    <a href="https://github.com/komeilmehranfar/sudoku-core">View Demo</a>
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

_For more examples, please refer to the [Documentation](https://example.com)_

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
