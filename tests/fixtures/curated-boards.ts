/**
 * Extra teaching / detection boards (user-supplied).
 * Sparse fragments may be non-unique — still used to check that a tactic fires.
 */
export interface CuratedBoard {
  /** Human label (usually the technique name) */
  label: string;
  /** Registry tactic id(s) that should cover this */
  tacticIds: string[];
  puzzle: string;
  /** false = teaching fragment; skip uniqueness assertion */
  expectUnique?: boolean;
}

export const CURATED_BOARDS: readonly CuratedBoard[] = [
  {
    label: "hidden-single-box",
    tacticIds: ["hidden-single"],
    puzzle:
      "000000000000000000000000000000000000000000000000000000000080019000000360000000542",
    expectUnique: false,
  },
  {
    label: "hidden-single-line",
    tacticIds: ["hidden-single"],
    puzzle:
      "000400000000000000000000000000090000000030000000070000000060000000000000000050000",
    expectUnique: false,
  },
  {
    label: "hidden-pair",
    tacticIds: ["hidden-pair"],
    puzzle:
      "203000000400000000900000000000000000000000000000000000000000000080000000070000000",
    expectUnique: false,
  },
  {
    label: "hidden-triple",
    tacticIds: ["hidden-groups"],
    puzzle:
      "705300100130500926000000030070600803000030000903000050300040000081009300600013002",
  },
  {
    label: "hidden-triple",
    tacticIds: ["hidden-groups"],
    puzzle:
      "200500097000009008000030002001078000000050000075090061968300010710005009450900006",
  },
  {
    label: "hidden-triple",
    tacticIds: ["hidden-groups"],
    puzzle:
      "306000000458230097107000000649350702573000000812674900265913478731480029984000301",
  },
  {
    label: "hidden-quadruple",
    tacticIds: ["hidden-groups"],
    puzzle:
      "100900000670582000009000000481700352002104708007020000010007006306000087700600500",
  },
  {
    label: "hidden-quadruple",
    tacticIds: ["hidden-groups"],
    puzzle:
      "000953006003001009095060830006070923070006010500400768054607000028300000900000000",
  },
  {
    label: "hidden-quadruple",
    tacticIds: ["hidden-groups"],
    puzzle:
      "020000109361070800095021000073062510000000200102008000000000940000290670000040305",
  },
  {
    label: "naked-single",
    tacticIds: ["naked-single", "open-singles"],
    puzzle:
      "500000000600000000700000000400000000900000000100000000000000000000000203000000000",
    expectUnique: false,
  },
  {
    label: "naked-single",
    tacticIds: ["naked-single", "open-singles"],
    puzzle:
      "900000000060001800000200450006004020009500004100020000001305940003062700008000003",
    expectUnique: false,
  },
  {
    label: "naked-single",
    tacticIds: ["naked-single", "open-singles"],
    puzzle:
      "060093400000000000024080001000078000000009000010006042506000034001000200802300705",
    expectUnique: false,
  },
  {
    label: "naked-pair",
    tacticIds: ["naked-pair"],
    puzzle:
      "900072003742103000000080200050000000200001068009700001800000050004007009000036700",
  },
  {
    label: "naked-pair",
    tacticIds: ["naked-pair"],
    puzzle:
      "000500008500049000700061054960420185100000407008100390695702840020004500000000009",
  },
  {
    label: "naked-triple",
    tacticIds: ["naked-triple"],
    puzzle:
      "217635004345918000689724351823567419456291738791483060078346100030100000160800003",
  },
  {
    label: "naked-triple",
    tacticIds: ["naked-triple"],
    puzzle:
      "960010000080900402020000930000000000610800000850149200098057600006090008075600029",
  },
  {
    label: "naked-quadruple",
    tacticIds: ["naked-quad"],
    puzzle:
      "080009574941005268705800913000000306000000841100000702452981637819003425637500189",
  },
  {
    label: "naked-quadruple",
    tacticIds: ["naked-quad"],
    puzzle:
      "040020538520843910083005000862734100000260873000580264000000000000352000290018300",
  },
  {
    label: "naked-quadruple",
    tacticIds: ["naked-quad"],
    puzzle:
      "362000700008000203700320060820100547007254000540007020000061900901542070000000000",
  },
  {
    label: "locked-candidate",
    tacticIds: ["pointing-elimination"],
    puzzle:
      "742000385895723010316845972058302000427080031063400208030008040070604800084000100",
  },
  {
    label: "locked-candidate",
    tacticIds: ["pointing-elimination"],
    puzzle:
      "021068375008000164007000829070000006000096002002005013780520641506007238200680597",
  },
  {
    label: "locked-candidate",
    tacticIds: ["pointing-elimination"],
    puzzle:
      "005016000000000010000490870507000009000040000064002000020000080600500002453028107",
  },
];
