# Tests

```
tests/
  api.test.ts              Public API: analyze / solve / hint / generate
  puzzles.test.ts          Published boards (curated catalog + Project Euler 96)
  tactics/
    registry.test.ts       Every registered tactic has a board and fires soundly
    curated.test.ts        Extra teaching boards (user-supplied)
    trust.test.ts          Never delete the true solution digit
    examples.test.ts       Technique example coverage
  fixtures/
    api-boards.ts          Sample boards for api.test (L1/L4/L5/L6/L8)
    registry-boards.ts     One unique board per tactic id
    curated-boards.ts      Extra teaching / detection boards
    real-world.ts          Named published puzzles
    parse.ts               81-char string → Board
    project-euler-96.txt
    technique-examples.json
  helpers/
    trust.ts               Soundness helpers + findAfterBasics
```
