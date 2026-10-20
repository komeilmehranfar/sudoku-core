import { openSinglesTactic } from "./open-singles";
import { nakedSingleTactic } from "./naked-single";
import { hiddenSingleTactic } from "./hidden-single";
import { nakedPairTactic } from "./naked-pair";
import { pointingEliminationTactic } from "./locked-candidates";
import { hiddenPairTactic } from "./hidden-pair";
import { hiddenGroupsTactic } from "./hidden-groups";
import { nakedTripleTactic } from "./naked-triple";
import { nakedQuadTactic } from "./naked-quad";
import { xWingTactic, swordfishTactic, jellyfishTactic } from "./fish";
import { skyscraperTactic, twoStringKiteTactic, craneTactic } from "./turbot";
import { yWingTactic } from "./y-wing";
import { xyzWingTactic } from "./xyz-wing";
import { wWingTactic } from "./w-wing";
import { emptyRectangleTactic } from "./empty-rectangle";
import { uniqueRectangleTactic } from "./unique-rectangle";
import { simpleColouringTactic } from "./simple-colouring";
import {
  finnedXWingTactic,
  finnedSwordfishTactic,
  finnedJellyfishTactic,
} from "./finned-fish";
import { wxyzWingTactic } from "./wxyz-wing";
import { bugPlusOneTactic } from "./bug-plus-one";
import { xChainTactic } from "./x-chain";
import { xyChainTactic } from "./xy-chain";
import { medusa3dTactic } from "./medusa";
import { aicTactic } from "./aic";
import { nishioTactic } from "./nishio";
import type { Tactic } from "./types";

/**
 * Ordered by human difficulty × usefulness:
 * try easiest / most useful first on every step.
 */
export const TACTICS: readonly Tactic[] = [
  openSinglesTactic,
  nakedSingleTactic,
  hiddenSingleTactic,
  nakedPairTactic,
  pointingEliminationTactic,
  hiddenPairTactic,
  hiddenGroupsTactic,
  nakedTripleTactic,
  nakedQuadTactic,
  xWingTactic,
  skyscraperTactic,
  twoStringKiteTactic,
  craneTactic,
  swordfishTactic,
  yWingTactic,
  xyzWingTactic,
  wWingTactic,
  emptyRectangleTactic,
  uniqueRectangleTactic,
  simpleColouringTactic,
  finnedXWingTactic,
  wxyzWingTactic,
  finnedSwordfishTactic,
  jellyfishTactic,
  bugPlusOneTactic,
  finnedJellyfishTactic,
  xChainTactic,
  xyChainTactic,
  medusa3dTactic,
  aicTactic,
  nishioTactic,
];

export function tacticByTitle(title: string): Tactic | undefined {
  return TACTICS.find((t) => t.title === title);
}
