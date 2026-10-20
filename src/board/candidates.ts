import { FULL_CANDIDATES } from "./constants";

/** Bit (d - 1) set means digit d is a candidate. */
export type CandidateMask = number;

export function digitBit(digit: number): number {
  return 1 << (digit - 1);
}

export function hasDigit(mask: CandidateMask, digit: number): boolean {
  return (mask & digitBit(digit)) !== 0;
}

export function removeDigit(mask: CandidateMask, digit: number): CandidateMask {
  return mask & ~digitBit(digit);
}

export function addDigit(mask: CandidateMask, digit: number): CandidateMask {
  return mask | digitBit(digit);
}

export function candidateCount(mask: CandidateMask): number {
  let n = 0;
  let m = mask;
  while (m) {
    n += m & 1;
    m >>= 1;
  }
  return n;
}

export function singleDigit(mask: CandidateMask): number | null {
  if (candidateCount(mask) !== 1) return null;
  for (let d = 1; d <= 9; d++) {
    if (hasDigit(mask, d)) return d;
  }
  return null;
}

export function digitsFromMask(mask: CandidateMask): number[] {
  const digits: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (hasDigit(mask, d)) digits.push(d);
  }
  return digits;
}

export function maskFromDigits(digits: readonly number[]): CandidateMask {
  return digits.reduce((mask, d) => addDigit(mask, d), 0);
}

export function fullCandidates(): CandidateMask {
  return FULL_CANDIDATES;
}
