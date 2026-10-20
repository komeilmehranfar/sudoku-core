# AGENTS.md — sudoku-core

Zero-dependency TypeScript Sudoku engine published to npm: generate, solve step by step with named techniques, rate L1–L10, teach hints. Public API is `src/index.ts`; built with tsup to ESM + CJS.

## Commands

```bash
npm ci
npm test                         # full Jest suite (~45 s)
npx jest tests/api.test.ts       # one file
npm run lint                     # eslint src tests
npm run typecheck                # src without Node types, then src + tests
npm run build                    # tsup → dist/
npm run check:package            # publint + are-the-types-wrong (after build)
npm run size                     # size-limit budgets (after build)
npm run docs                     # TypeDoc → docs/api (gitignored)
```

Node `>=20`.

## Rules

- **No string literals in logic.** Compare and key on constants: `STRATEGY` / `TACTIC_ID` (`src/tactics/names.ts`), `STEP_TYPE`, `SOLVE_ERROR`, `DIFFICULTY_L*` (`src/board/constants.ts`), `HOUSE_KIND` / `TEACH_STRATEGY` / `TEACH_MODE` (`src/hint/teach.ts`). Add a constant before adding a new value. Display copy and error messages stay inline.
- **Output is a public contract.** Technique titles, `error` strings, `TEACH_MODE` values and the shape of results must not change silently. Changing a tactic's `rank`, `score` or its position in `TACTICS` changes puzzle ratings. For refactors, compare `solve` / `hint` / `analyze` / `teachHint` output on seeded boards (`generate(level, { seed })`) before and after.
- **`src` stays runtime-neutral and dependency-free:** ES2020, no Node APIs (base `tsconfig.json` has `"types": []`), no runtime `dependencies`.
- **Tests stay deterministic:** pass a `seed` to `generate` in tests.
- Fixture `source` fields: a neutral description or a URL already used in the fixtures; do not name new third-party sites.
- Conventional Commits (commitlint). Releases come from release-please: never bump `version` or edit `CHANGELOG.md` by hand.
- Prefer editing existing files; no planning/summary docs, duplicate helpers or drive-by refactors.

## Skills

Project skills live in `.agents/skills/` (`.claude/skills` links there). Use one primary skill per job; this file wins over skill advice.

| Job                                | Primary                                             |
| ---------------------------------- | --------------------------------------------------- |
| Any coding task (default stance)   | `ponytail`                                          |
| Review a diff / PR                 | `ponytail-review` (or `tidy` for diff-scoped fixes) |
| Pre-merge multi-axis review        | `code-review-and-quality`                           |
| Whole-repo audit                   | `ponytail-audit`                                    |
| List deferred `shortcut:` comments | `ponytail-debt`                                     |
| Simplify without changing behavior | `code-simplification`                               |
| Types, narrowing, generics         | `typescript-advanced-types`                         |
| Modern JS idioms                   | `modern-javascript-patterns`                        |
| Module boundaries / architecture   | `improve-codebase-architecture`                     |
| Edit this file                     | `agents-md`                                         |

After substantial changes, run a review skill, then `npm run lint`, `npm run typecheck` and `npm test`.
