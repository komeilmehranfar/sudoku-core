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
 * Sorted by `rank`, easiest first. The solver takes the first tactic that
 * fires, and the rating is the hardest rank used — so an easier tactic listed
 * after a harder one would inflate ratings (registry.test.ts enforces this).
 */
export const TACTICS: readonly Tactic[] = [
  openSinglesTactic, // 1.0
  hiddenSingleTactic, // 1.5
  nakedSingleTactic, // 2.3
  pointingEliminationTactic, // 2.6
  nakedPairTactic, // 3.0
  xWingTactic, // 3.2
  hiddenPairTactic, // 3.4
  hiddenGroupsTactic, // 3.5
  nakedTripleTactic, // 3.6
  nakedQuadTactic, // 3.8
  swordfishTactic, // 3.8
  skyscraperTactic, // 4.0
  twoStringKiteTactic, // 4.0
  craneTactic, // 4.1
  yWingTactic, // 4.2
  wWingTactic, // 4.3
  xyzWingTactic, // 4.4
  simpleColouringTactic, // 4.5
  emptyRectangleTactic, // 4.6
  finnedXWingTactic, // 4.7
  uniqueRectangleTactic, // 4.8
  wxyzWingTactic, // 4.8
  finnedSwordfishTactic, // 5.0
  bugPlusOneTactic, // 5.1
  jellyfishTactic, // 5.2
  finnedJellyfishTactic, // 5.4
  xChainTactic, // 6.6
  xyChainTactic, // 6.8
  medusa3dTactic, // 7.2
  aicTactic, // 7.5
  nishioTactic, // 7.9
];

export function tacticByTitle(title: string): Tactic | undefined {
  return TACTICS.find((t) => t.title === title);
}
