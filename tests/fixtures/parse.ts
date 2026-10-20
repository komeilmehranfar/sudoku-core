import type { Board } from "../../src/types";

/** Parse an 81-char puzzle string (0 or . = empty). */
export function parsePuzzleString(puzzle: string): Board {
  const cleaned = puzzle.replace(/[^0-9.]/g, "");
  if (cleaned.length !== 81) {
    throw new Error(`Puzzle ${cleaned.length} chars, expected 81`);
  }
  return [...cleaned].map((c) => (c === "0" || c === "." ? null : Number(c)));
}
