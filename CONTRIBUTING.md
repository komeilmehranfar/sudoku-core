# Contributing to sudoku-core

Thanks for your interest in improving `sudoku-core`. This guide covers local setup, the project layout, how to add a solving technique, and how commits and releases work.

By participating you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Setup

Requirements: Node.js 20 or newer, npm.

```sh
git clone https://github.com/komeilmehranfar/sudoku-core.git
cd sudoku-core
npm ci
npm test
```

`npm ci` also installs the git hooks (husky). The pre-commit hook runs lint-staged (`eslint --fix` and Prettier on staged files), and the commit-msg hook runs commitlint.

## Scripts

| Command                 | What it does                                                  |
| ----------------------- | ------------------------------------------------------------- |
| `npm run build`         | Build the package with tsup                                   |
| `npm test`              | Run the Jest test suite                                       |
| `npm run lint`          | Lint with ESLint                                              |
| `npm run typecheck`     | Type-check `src` (no Node types) and the tests                |
| `npm run check:package` | Validate the published package (publint, are-the-types-wrong) |
| `npm run size`          | Check bundle size budgets (size-limit)                        |
| `npm run docs`          | Generate API docs with TypeDoc                                |

Before opening a pull request, run at least `npm run lint`, `npm run typecheck` and `npm test`. If you changed exports or build config, also run `npm run build`, `npm run check:package` and `npm run size`.

## Project layout

```
src/
  index.ts            Public API entry point
  types.ts            Public types (Board, SolvingStep, Difficulty, ...)
  board/              Grid state, candidate bitmasks, houses (rows/cols/boxes)
  tactics/            One file per solving technique
    types.ts          Tactic interface and step() helper
    registry.ts       Ordered TACTICS list used by solver, hinter and rater
    apply.ts          Step search and walkthrough
  rate/difficulty.ts  L1-L10 rating from hardest technique rank + effort score
  generate/           Puzzle generator
  hint/               Hints and teaching metadata
  uniqueness/         Solution counting
  learn/              Example generation for teaching boards
tests/
  api.test.ts         Public API tests
  puzzles.test.ts     Published puzzles (curated catalog, Project Euler 96)
  tactics/            Registry, trust (soundness) and curated-board tests
  fixtures/           Boards used by the tests
  helpers/            Soundness helpers (trust.ts)
```

See [tests/README.md](./tests/README.md) for a description of each test file and fixture.

## Adding a new technique

Each technique is a `Tactic` object (see `src/tactics/types.ts`):

```ts
export const nakedPairTactic: Tactic = {
  id: TACTIC_ID.NAKED_PAIR, // kebab-case slug, from src/tactics/names.ts
  title: STRATEGY.NAKED_PAIR, // public name, appears as SolvingStep.strategy
  score: 50, // relative human effort, summed into the rating score
  rank: 3.0, // SE-like rank; the hardest rank used decides L1-L10
  type: STEP_TYPE.ELIMINATION, // or STEP_TYPE.VALUE
  find(state) {
    /* return step(...) or null */
  },
};
```

**No string literals in logic.** Compare and key on constants: `STRATEGY`, `TACTIC_ID` (`src/tactics/names.ts`), `STEP_TYPE`, `SOLVE_ERROR` and the `DIFFICULTY_L*` values (`src/board/constants.ts`), and `HOUSE_KIND` / `TEACH_STRATEGY` (`src/hint/teach.ts`). Display copy and error messages are the only strings that belong inline.

1. **Add the names.** Add the id to `TACTIC_ID` and the title to `STRATEGY` in `src/tactics/names.ts`.
2. **Create `src/tactics/<id>.ts`.** Export a `Tactic`. `find` receives the current `GridState` and returns the first applicable step, or `null`. Build the result with `step(tactic, updates, teaching)` from `./types`. Elimination updates are `{ index, eliminatedCandidate }`. Pass teaching data (`patternCells`, `patternDigits`, `regionCells`) so hints can highlight the pattern; `regionFromCells` and `regionFromHouses` help build `regionCells`. `find` must not mutate `state`.
3. **Pick `rank` and `score`.** `rank` maps to a difficulty band in `mapDifficulty` (`src/rate/difficulty.ts`). For example, ranks from 4.2 up to (but not including) 5.0 are L8, and ranks of 7.0 and above are L10. Compare with existing techniques of similar difficulty. If the technique belongs in a band's description, update the band comment in `difficulty.ts`.
4. **Register it in `src/tactics/registry.ts`.** Import the tactic and insert it into `TACTICS`. Keep the list sorted by `rank`: the solver takes the first tactic that fires, so an easier tactic listed after a harder one inflates ratings. `registry.test.ts` enforces the order.
5. **Add a registry fixture.** Add one entry to `REGISTRY_BOARDS` in `tests/fixtures/registry-boards.ts` with `tacticId` equal to your `id`, a `source` (URL or short description), and an 81-character `puzzle` string (`0` = empty). The board must have a unique solution, and the technique must fire on it after the basic techniques are applied. `tests/tactics/registry.test.ts` fails if a registered tactic has no fixture, if a fixture has no matching tactic, or if the tactic does not produce a sound step on its board.
6. **Keep it sound.** `tests/tactics/trust.test.ts` checks that no tactic ever eliminates the true solution digit, on technique examples (`tests/fixtures/technique-examples.json`), on the registry and curated fixture boards, and on full walkthroughs of published puzzles (Project Euler 96 and `tests/fixtures/real-world.ts`). If you have example boards for the technique, add them to the JSON and map the technique slug to your tactic id in `TECHNIQUE_TO_TACTIC` in that test.
7. **Optional:** add teaching boards to `tests/fixtures/curated-boards.ts`, a learn target in `src/learn/generate-examples.ts`, and an entry in the README's technique list.

Changing a tactic's `title` is a breaking change, because consumers can match on `SolvingStep.strategy`. Changing `rank`, `score` or registry order can change the difficulty ratings of existing puzzles. Call that out in the pull request.

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Commitlint enforces this in the commit-msg hook.

```
<type>(<optional scope>): <description>
```

Common types: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`.

Examples:

```
feat(tactics): add Sue de Coq
fix(rate): keep naked pair puzzles in L5
docs: clarify hint() return type
feat!: rename Difficulty values
```

If your pull request is squash-merged, the **PR title** becomes the commit on `main`, so it must also follow the convention.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). It reads commit messages on `main` and opens a release PR that bumps the version and updates `CHANGELOG.md`:

- `fix:` produces a patch release
- `feat:` produces a minor release
- `feat!:`, `fix!:` or a `BREAKING CHANGE:` footer produces a major release
- Other types (`docs`, `chore`, `test`, ...) do not trigger a release on their own

Do **not** bump the version in `package.json` or edit `CHANGELOG.md` by hand. Merging the release PR publishes to npm.

## Pull request checklist

- [ ] The PR title follows Conventional Commits
- [ ] Tests cover the change (new technique: registry fixture added)
- [ ] `npm run lint`, `npm run typecheck` and `npm test` pass
- [ ] `npm run build`, `npm run check:package` and `npm run size` pass if exports or build config changed
- [ ] Public API changes are reflected in the README and TSDoc comments
- [ ] Breaking changes and rating changes are described in the PR body
- [ ] No manual version bump or `CHANGELOG.md` edit

## Reporting bugs and security issues

Use the issue templates for bugs and feature requests. Include the board as an 81-item array or an 81-character string, because most bugs depend on the exact puzzle.

Do not report security vulnerabilities in public issues. See [SECURITY.md](./SECURITY.md).
