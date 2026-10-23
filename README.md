<div align="center">

<img src="https://raw.githubusercontent.com/komeilmehranfar/sudoku-core/main/assets/sudoku-core.png" alt="sudoku-core: a Sudoku grid showing an X-Wing next to the sudoku-core wordmark" width="760">

<p><strong>A human-logic Sudoku engine for TypeScript.</strong><br>
Generate unique puzzles across ten difficulty levels, solve them step by step with 31 named techniques, rate them, and explain every move.</p>

<p>
  <a href="https://www.npmjs.com/package/sudoku-core"><img src="https://img.shields.io/npm/v/sudoku-core?style=flat-square" alt="npm version"></a>
  <a href="https://github.com/komeilmehranfar/sudoku-core/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/komeilmehranfar/sudoku-core/ci.yml?branch=main&style=flat-square&label=CI" alt="CI status"></a>
  <a href="https://bundlejs.com/?q=sudoku-core"><img src="https://img.shields.io/bundlejs/size/sudoku-core?style=flat-square" alt="bundle size"></a>
  <img src="https://img.shields.io/npm/types/sudoku-core?style=flat-square" alt="TypeScript types included">
  <a href="https://www.npmjs.com/package/sudoku-core"><img src="https://img.shields.io/npm/dm/sudoku-core?style=flat-square" alt="npm downloads"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/sudoku-core?style=flat-square" alt="MIT license"></a>
</p>

<p>Sponsored by <a href="https://sudoku.best"><strong>Sudoku.best</strong></a></p>

</div>

## Why sudoku-core

- **Solves like a person.** Every step is a named technique (Hidden Single, X-Wing, Y-Wing, AIC, …), never brute-force guessing. You get the steps, not just the answer.
- **Honest difficulty.** Puzzles are rated `L1`–`L10` by the hardest technique they actually require, so "L7" means the same thing every time.
- **Unique puzzles, on demand.** `generate("L5")` returns a puzzle with exactly one solution. Pass a `seed` for reproducible daily challenges.
- **Built for teaching.** `teachHint` returns the cells to highlight, the candidates to strike out and a plain-English explanation, and it can check a player's pencil marks.
- **Small and portable.** Zero dependencies, about 13 kB minified and brotli-compressed, ESM and CommonJS builds with bundled type definitions. Runs in Node 20+, browsers, web workers and edge runtimes.

## Install

```sh
npm install sudoku-core
```

## Quick start

```ts
import { generate, solve, hint, analyze } from "sudoku-core";

const puzzle = generate("L4", { seed: 2 }); // seeded = same puzzle every time

analyze(puzzle).difficulty; // "L4"
hint(puzzle).steps; // the next move, with the technique that justifies it
solve(puzzle).board; // the full solution
```

CommonJS works too: `const { generate } = require("sudoku-core")`.

## The board

A board is an array of 81 cells in row-major order: index `row * 9 + column`, with rows and columns counted from 0. Each cell is a digit `1`–`9` or `null` when empty.

```ts
const board = [
  6,
  9,
  null,
  4,
  2,
  null,
  null,
  null,
  1,
  // … 72 more cells
];
```

## API

### `generate(difficulty, options?)`

Returns a new puzzle with exactly one solution that human-logic techniques can solve.

```ts
generate("L1"); // gentle: open singles only
generate("L8", { seed: 20261020 }); // deterministic, e.g. a daily puzzle
generate("L6", { timeoutMs: 5_000 }); // cap the search time
```

| Option        | Default | Meaning                                                                                                                |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `seed`        | random  | Same seed and level always give the same puzzle.                                                                       |
| `timeoutMs`   | `16000` | Wall-clock budget. With a `seed` there is no limit by default, so the same seed gives the same puzzle on every device. |
| `maxAttempts` | `500`   | Fresh grids to dig before giving up.                                                                                   |

The puzzle is always rated exactly the requested level. `generate` throws only if it cannot find one within the budget, which is rare with the defaults.

### `solve(board)`

Solves the whole board and returns every step, plus the [analysis](#analyzeboard).

```ts
const result = solve(puzzle);

result.solved; // true
result.board; // [6, 9, 3, 4, 2, 7, 8, 5, 1, …]
result.steps.length; // 55
result.steps[0];
// {
//   strategy: "Single Candidate Strategy",
//   type: "value",
//   updates: [{ index: 20, filledValue: 4 }],
//   patternCells: [20],
//   regionCells: [18, 19, 20, …]
// }
```

Each step has a `strategy` (the technique title), a `type` (`"value"` places digits, `"elimination"` removes candidates) and the `updates` it makes. `patternCells`, `patternDigits` and `regionCells` say what to highlight in a UI.

### `hint(board)`

Advances the board to its next placement. `steps` lists any eliminations needed first, then the placement itself.

```ts
const { board: next, steps } = hint(puzzle);
steps[steps.length - 1].strategy; // "Single Candidate Strategy"
```

### `analyze(board)`

Rates a board without returning the solution.

```ts
analyze(puzzle);
// {
//   hasSolution: true,
//   hasUniqueSolution: true,
//   difficulty: "L4",
//   hardestTechnique: "Pointing Elimination Strategy",
//   hardestRank: 2.6,
//   score: 362.9,
//   tedium: 1.02,
//   usedStrategies: [
//     { title: "Open Singles Strategy", freq: 19 },
//     { title: "Single Candidate Strategy", freq: 34 },
//     { title: "Visual Elimination Strategy", freq: 1 },
//     { title: "Pointing Elimination Strategy", freq: 1 }
//   ]
// }
```

`score` is the summed effort of every step, and `tedium` is steps per placement (higher means more grinding).

### `teachHint(board, notes?, mode?)`

A UI-ready hint: what to highlight, what to strike out, and why.

```ts
import {
  teachHint,
  applyTeachStep,
  candidatesFromBoard,
  TEACH_MODE,
} from "sudoku-core";

const tip = teachHint(puzzle);
// {
//   label: "Hidden Single (Row)",
//   digit: 4,
//   focusCell: 20,
//   explanation: "The candidate 4 has been ruled out from all other cells …",
//   regionCells: […], relatedCells: […], digitCells: […], elimMarks: [],
//   step: { … }   // pass to applyTeachStep to play it
// }
```

- Pass the player's pencil marks as `notes` (an array of 81 digit lists). In the default `TEACH_MODE.OPEN` it first points out impossible marks (`"Impossible Candidate"`) and missing ones (`"Missing Candidate"`) before teaching the next technique.
- `TEACH_MODE.CONTINUE` treats the lists you pass as the working candidates, for stepping through a walkthrough with `applyTeachStep(board, candidates, tip.step)`.
- `candidatesFromBoard(board)` returns the legal candidates for every cell.
- `teachHint` returns `null` when the board is complete or no technique applies.

### Uniqueness helpers

```ts
import {
  isUniqueSolution,
  hasAnySolution,
  getUniqueSolution,
} from "sudoku-core";

isUniqueSolution(board); // exactly one solution?
hasAnySolution(board); // at least one?
getUniqueSolution(board); // the solved grid, or null if there are zero or several
```

These use a fast backtracking search and work on any board, including ones human logic can't finish.

### Errors

`solve` and `hint` never throw. When something is wrong they return `solved: false` with a machine-readable `errorCode` (plus a human-readable `error`):

| `errorCode`          | Meaning                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `INVALID_BOARD`      | Not 81 cells, a value outside 1–9, or the same digit twice in a row, column or box.       |
| `NO_SOLUTION`        | The givens are consistent, but no solution exists.                                        |
| `NEEDS_GUESSING`     | A solution exists, but the techniques get stuck (for example "Everest"-class puzzles).    |
| `MULTIPLE_SOLUTIONS` | More than one solution, so logic usually can't finish it; `hint` may still place a digit. |

```ts
import { solve, SOLVE_ERROR } from "sudoku-core";

const result = solve(board);
if (result.errorCode === SOLVE_ERROR.NEEDS_GUESSING) {
  // fall back to getUniqueSolution(board)
}
```

### Constants and types

Compare against exported constants rather than string literals:

| Export                                       | Contents                                                        |
| -------------------------------------------- | --------------------------------------------------------------- |
| `DIFFICULTIES`                               | `["L1", …, "L10"]`                                              |
| `STRATEGY`                                   | Every technique title, e.g. `STRATEGY.X_WING`                   |
| `TACTIC_ID`                                  | Stable technique ids, e.g. `TACTIC_ID.X_WING === "x-wing"`      |
| `STEP_TYPE`                                  | `VALUE`, `ELIMINATION`, `ADD`                                   |
| `SOLVE_ERROR`                                | The error codes above                                           |
| `TACTICS`                                    | The ordered technique registry (`id`, `title`, `rank`, `score`) |
| `TEACH_MODE`, `TEACH_STRATEGY`, `HOUSE_KIND` | Values used by `teachHint`                                      |

```ts
import { solve, STRATEGY } from "sudoku-core";

const usesXWing = solve(board).steps?.some(
  (s) => s.strategy === STRATEGY.X_WING,
);
```

All public types (`Board`, `Difficulty`, `SolvingStep`, `SolvingResult`, `AnalyzeData`, `TeachingHint`, …) are exported. Run `npm run docs` in a clone for the full TypeDoc reference.

## Difficulty levels and techniques

A puzzle's level is set by the hardest technique it needs. A long grind of easy steps can push it up by one level.

| Level | Techniques it introduces                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------- |
| L1    | Open Singles (the last empty cell in a row, column or box)                                              |
| L2    | Hidden Single                                                                                           |
| L3    | Naked Single                                                                                            |
| L4    | Pointing (locked candidates)                                                                            |
| L5    | Naked Pair                                                                                              |
| L6    | Hidden Pair, Hidden Triple / Quad, Naked Triple, Naked Quad, X-Wing, Swordfish                          |
| L7    | Skyscraper, Two-String Kite, Crane                                                                      |
| L8    | Y-Wing, W-Wing, XYZ-Wing, WXYZ-Wing, Simple Colouring, Empty Rectangle, Unique Rectangle, Finned X-Wing |
| L9    | Jellyfish, Finned Swordfish, Finned Jellyfish, BUG+1, X-Chain, XY-Chain                                 |
| L10   | 3D Medusa, Alternating Inference Chains (AIC), Nishio forcing chains                                    |

The titles in `SolvingStep.strategy` are kept stable across versions. Two keep their v3 names: Hidden Single is `"Single Candidate Strategy"` and Naked Single is `"Visual Elimination Strategy"`. See `STRATEGY` for every title.

## Migrating from v3

v4 replaces the engine. The function names and return shapes stay the same, with these changes:

- **Difficulty values** are now `"L1"`–`"L10"` instead of `"easy" | "medium" | "hard" | "expert" | "master"`. v3 used only techniques up to Hidden Pair, so its puzzles fall within `L1`–`L6`. Use the table above to pick new levels.
- **`AnalyzeData`** adds `hardestTechnique`, `hardestRank` and `tedium`. `usedStrategies` entries are never `null`.
- **`Update.filledValue`** is optional: elimination updates carry only `eliminatedCandidate`.
- **New:** `seed` for `generate`, `errorCode` on results, `teachHint` and the uniqueness helpers, and 25 more techniques.
- Technique titles and the `error` message strings are unchanged.

See [CHANGELOG.md](./CHANGELOG.md) for the full list.

## Contributing

Bug reports, technique requests and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, the project layout and how to add a technique. Please follow the [Code of Conduct](./CODE_OF_CONDUCT.md), and report security issues privately as described in [SECURITY.md](./SECURITY.md).

## Sponsor

sudoku-core is sponsored by **[Sudoku.best](https://sudoku.best)**.

## Acknowledgements

Inspired by [sudokuJS](https://github.com/pocketjoso/sudokuJS) by Jonas Ohlsson Aden.

## License

[MIT](./LICENSE) © [Komeil Mehranfar](https://github.com/komeilmehranfar)
