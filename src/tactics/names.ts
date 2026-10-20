/** Stable tactic ids (also used as lesson / fixture keys). */
export const TACTIC_ID = {
  MEDUSA_3D: "3d-medusa",
  AIC: "aic",
  BUG_PLUS_ONE: "bug-plus-one",
  CRANE: "crane",
  EMPTY_RECTANGLE: "empty-rectangle",
  FINNED_JELLYFISH: "finned-jellyfish",
  FINNED_SWORDFISH: "finned-swordfish",
  FINNED_X_WING: "finned-x-wing",
  HIDDEN_GROUPS: "hidden-groups",
  HIDDEN_PAIR: "hidden-pair",
  HIDDEN_QUAD: "hidden-quad",
  HIDDEN_SINGLE: "hidden-single",
  HIDDEN_TRIPLE: "hidden-triple",
  JELLYFISH: "jellyfish",
  NAKED_PAIR: "naked-pair",
  NAKED_QUAD: "naked-quad",
  NAKED_SINGLE: "naked-single",
  NAKED_TRIPLE: "naked-triple",
  NISHIO: "nishio",
  OPEN_SINGLES: "open-singles",
  POINTING_ELIMINATION: "pointing-elimination",
  SIMPLE_COLOURING: "simple-colouring",
  SKYSCRAPER: "skyscraper",
  SWORDFISH: "swordfish",
  TWO_STRING_KITE: "two-string-kite",
  UNIQUE_RECTANGLE: "unique-rectangle",
  W_WING: "w-wing",
  WXYZ_WING: "wxyz-wing",
  X_CHAIN: "x-chain",
  X_WING: "x-wing",
  XY_CHAIN: "xy-chain",
  XYZ_WING: "xyz-wing",
  Y_WING: "y-wing",
} as const;

export type TacticId = (typeof TACTIC_ID)[keyof typeof TACTIC_ID];

/**
 * Public technique titles, as reported in `SolvingStep.strategy`.
 * Renaming one is a breaking change for consumers.
 */
export const STRATEGY = {
  MEDUSA_3D: "3D-Medusa Strategy",
  AIC: "AIC Strategy",
  BUG_PLUS_ONE: "BUG+1 Strategy",
  CRANE: "Crane Strategy",
  EMPTY_RECTANGLE: "Empty Rectangle Strategy",
  FINNED_JELLYFISH: "Finned Jellyfish Strategy",
  FINNED_SWORDFISH: "Finned Swordfish Strategy",
  FINNED_X_WING: "Finned X-Wing Strategy",
  HIDDEN_GROUPS: "Hidden Groups Strategy",
  HIDDEN_PAIR: "Hidden Pair Strategy",
  HIDDEN_QUAD: "Hidden Quad Strategy",
  HIDDEN_SINGLE: "Single Candidate Strategy",
  HIDDEN_TRIPLE: "Hidden Triple Strategy",
  JELLYFISH: "Jellyfish Strategy",
  NAKED_PAIR: "Naked Pair Strategy",
  NAKED_QUAD: "Naked Quadruple Strategy",
  NAKED_SINGLE: "Visual Elimination Strategy",
  NAKED_TRIPLE: "Naked Triplet Strategy",
  NISHIO: "Nishio Forcing Chain Strategy",
  OPEN_SINGLES: "Open Singles Strategy",
  POINTING_ELIMINATION: "Pointing Elimination Strategy",
  SIMPLE_COLOURING: "Simple Colouring Strategy",
  SKYSCRAPER: "Skyscraper Strategy",
  SWORDFISH: "Swordfish Strategy",
  TWO_STRING_KITE: "Two-String-Kite Strategy",
  UNIQUE_RECTANGLE: "Unique Rectangle Strategy",
  W_WING: "W-Wing Strategy",
  WXYZ_WING: "WXYZ-Wing Strategy",
  X_CHAIN: "X-Chain Strategy",
  X_WING: "X-Wing Strategy",
  XY_CHAIN: "XY-Chain Strategy",
  XYZ_WING: "XYZ-Wing Strategy",
  Y_WING: "Y-Wing Strategy",
} as const;

export type Strategy = (typeof STRATEGY)[keyof typeof STRATEGY];

const STRATEGY_SUFFIX = / Strategy$/;

/** Display name without the suffix: "X-Wing Strategy" → "X-Wing". */
export function techniqueName(strategy: string): string {
  return strategy.replace(STRATEGY_SUFFIX, "");
}
