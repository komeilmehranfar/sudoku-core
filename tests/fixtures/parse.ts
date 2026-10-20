import * as fs from "fs";
import * as path from "path";
import type { Board } from "../../src/types";

/** Parse an 81-char puzzle string (0 or . = empty). */
export function parsePuzzleString(puzzle: string): Board {
  const cleaned = puzzle.replace(/[^0-9.]/g, "");
  if (cleaned.length !== 81) {
    throw new Error(`Puzzle ${cleaned.length} chars, expected 81`);
  }
  return [...cleaned].map((c) => (c === "0" || c === "." ? null : Number(c)));
}

/** The 50 grids from Project Euler problem 96. */
export function loadProjectEuler96(): { id: string; board: Board }[] {
  const file = path.join(__dirname, "project-euler-96.txt");
  const lines = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  const puzzles: { id: string; board: Board }[] = [];
  for (let i = 0; i < lines.length;) {
    const header = lines[i++];
    const rows = lines.slice(i, i + 9).join("");
    i += 9;
    puzzles.push({
      id: header.replace(/\s+/g, "-").toLowerCase(),
      board: parsePuzzleString(rows),
    });
  }
  return puzzles;
}
