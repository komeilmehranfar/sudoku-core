/**
 * Curated published boards (SudokuWiki / Wikipedia / Project Euler).
 */

export interface RealWorldPuzzle {
  id: string;
  /** Where the puzzle was published / documented */
  source: string;
  /** Technique focus (SudokuWiki naming) */
  focus?: string;
  /** 81 chars, digits 1-9 and 0 for empty */
  puzzle: string;
  /** Expected to be fully solvable with our human-logic tactics */
  humanSolvable: boolean;
  /** Technique title that should appear in the walkthrough when humanSolvable */
  expectTechnique?: string;
}

export const REAL_WORLD_PUZZLES: RealWorldPuzzle[] = [
  {
    id: "wikipedia-classic",
    source: "https://en.wikipedia.org/wiki/Sudoku",
    focus: "Naked / Hidden Singles",
    puzzle:
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    humanSolvable: true,
  },
  {
    id: "sudokuwiki-hidden-pair-board",
    source: "https://www.sudokuwiki.org/sudoku.htm",
    focus: "Hidden Pair / Pointing",
    puzzle:
      "000030086000020000000008500371000094900000005400007600200700800030005000700004030",
    humanSolvable: true,
    expectTechnique: "Hidden Pair Strategy",
  },
  {
    id: "sudokuwiki-pointing-board",
    source:
      "https://www.sudokuwiki.org/sudoku.htm?bd=7..1...32...726.........6..82..7..533.......914..5..26..8.........215...47...8..5",
    focus: "Pointing Elimination (Locked Candidates)",
    puzzle:
      "700100032000726000000000600820070053300000009140050026008000000000215000470008005",
    humanSolvable: true,
    expectTechnique: "Pointing Elimination Strategy",
  },
  {
    id: "sudokuwiki-naked-pair-example",
    source: "https://www.sudokuwiki.org/naked_candidates",
    focus: "Naked Pair",
    // Unique, uses Naked Pair early; full finish needs techniques beyond current registry.
    puzzle:
      "040309010600000003002000400070103040000975000060804090001000900800000005030201080",
    humanSolvable: false,
    expectTechnique: "Naked Pair Strategy",
  },
  {
    id: "pe96-grid-01",
    source: "https://projecteuler.net/problem=96",
    focus: "Singles",
    puzzle:
      "003020600900305001001806400008102900700000008006708200002609500800203009005010300",
    humanSolvable: true,
  },
  {
    id: "pe96-grid-06",
    source: "https://projecteuler.net/problem=96",
    focus: "Pointing",
    puzzle:
      "100920000524010000000000070050008102000000000402700090060000000000030945000071006",
    humanSolvable: true,
    expectTechnique: "Pointing Elimination Strategy",
  },
  {
    id: "pe96-grid-07",
    source: "https://projecteuler.net/problem=96",
    focus: "X-Wing",
    puzzle:
      "043080250600000000000001094900004070000608000010200003820500000000000005034090710",
    humanSolvable: true,
    expectTechnique: "X-Wing Strategy",
  },
  {
    id: "pe96-grid-10",
    source: "https://projecteuler.net/problem=96",
    focus: "Naked Pair",
    puzzle:
      "001900003900700160030005007050000009004302600200000070600100030042007006500006800",
    humanSolvable: true,
    expectTechnique: "Naked Pair Strategy",
  },
  {
    id: "pe96-grid-42",
    source: "https://projecteuler.net/problem=96",
    focus: "Naked Pair + Pointing",
    puzzle:
      "380000000000400785009020300060090000800302009000040070001070500495006000000000092",
    humanSolvable: true,
    expectTechnique: "Naked Pair Strategy",
  },
  {
    id: "pe96-grid-50",
    source: "https://projecteuler.net/problem=96",
    focus: "X-Wing",
    puzzle:
      "300200000000107000706030500070009080900020004010800050009040301000702000000008006",
    humanSolvable: true,
    expectTechnique: "X-Wing Strategy",
  },
  {
    id: "y-wing-generated",
    source: "Generated for Y-Wing coverage",
    focus: "Y-Wing / Skyscraper family (turbot may fire first in walkthrough)",
    puzzle:
      "050600010010095007026000000007006000080000002100050803008003000300000126000700900",
    humanSolvable: true,
  },
];
