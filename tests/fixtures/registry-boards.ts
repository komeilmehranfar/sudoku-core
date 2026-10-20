/**
 * Exactly one unique board per registered tactic id.
 * Used by tactics/registry.test.ts — every tactic must fire soundly here.
 */
export interface RegistryBoardFixture {
  tacticId: string;
  source: string;
  /** 81-char puzzle string (0 = empty) */
  puzzle: string;
}

export const REGISTRY_BOARDS: readonly RegistryBoardFixture[] = [
  {
    tacticId: "open-singles",
    source: "https://en.wikipedia.org/wiki/Sudoku",
    puzzle:
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
  },
  {
    tacticId: "naked-single",
    source: "teaching example — naked-single",
    puzzle:
      "003000002000704000000005300280903005000070201900400008006059000020000060050010400",
  },
  {
    tacticId: "hidden-single",
    source: "teaching example — hidden-single",
    puzzle:
      "020080004000000070000790305100430000050000012040000000008006597000010020000870000",
  },
  {
    tacticId: "naked-pair",
    source: "user batch — naked-pair",
    puzzle:
      "900072003742103000000080200050000000200001068009700001800000050004007009000036700",
  },
  {
    tacticId: "pointing-elimination",
    source: "user batch — locked-candidate",
    puzzle:
      "742000385895723010316845972058302000427080031063400208030008040070604800084000100",
  },
  {
    tacticId: "hidden-pair",
    source: "teaching example — hidden-pair",
    puzzle:
      "000007003604000000090004050068050109000070520009000000800900600020000010000002037",
  },
  {
    tacticId: "naked-triple",
    source: "user batch — naked-triple",
    puzzle:
      "217635004345918000689724351823567419456291738791483060078346100030100000160800003",
  },
  {
    tacticId: "naked-quad",
    source: "user batch — naked-quadruple",
    puzzle:
      "080009574941005268705800913000000306000000841100000702452981637819003425637500189",
  },
  {
    tacticId: "x-wing",
    source: "teaching example — x-wing",
    puzzle:
      "000000000013027060790800200006003709000050000005900000000000000371600800060040100",
  },
  {
    tacticId: "swordfish",
    source: "teaching example — swordfish",
    puzzle:
      "002003000007080050000400800061700000500040009000506000900001506000000000870000240",
  },
  {
    tacticId: "y-wing",
    source: "teaching example — y-wing",
    puzzle:
      "004000080000100900610000002000000000849050010031200007000010070000806005700500690",
  },
  {
    tacticId: "xyz-wing",
    source: "teaching example — xyz-wing",
    puzzle:
      "000008070002037006004000100840700000009000040500002300000600004076000003000980700",
  },
  {
    tacticId: "empty-rectangle",
    source: "teaching example — empty-rectangle",
    puzzle:
      "090318572253749618781020349120063784067000123348271956010037205070002431032150807",
  },
  {
    tacticId: "wxyz-wing",
    source: "teaching example — wxyz-wing",
    puzzle:
      "000094000049200000100003090007000500500062087000045000700008341300000002000076800",
  },
  {
    tacticId: "jellyfish",
    source: "teaching example — jellyfish",
    puzzle:
      "040195006200000000000000413000040209008069037000003001030500000075030000900000000",
  },
  {
    tacticId: "x-chain",
    source: "teaching example — x-chain",
    puzzle:
      "030100200000402030000500190000890070900003600074006900102300007060000000300000000",
  },
  {
    tacticId: "xy-chain",
    source: "teaching example — xy-chain",
    puzzle:
      "000059000000300080300041029000400001030210000000003650700002090092060805500000000",
  },
  {
    tacticId: "hidden-groups",
    source: "user batch — hidden-triple",
    puzzle:
      "705300100130500926000000030070600803000030000903000050300040000081009300600013002",
  },
  {
    tacticId: "skyscraper",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "two-string-kite",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "crane",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "w-wing",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "simple-colouring",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "finned-x-wing",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "finned-swordfish",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "finned-jellyfish",
    source: "https://sudopedia.sudocue.net/index.php?title=Skyscraper",
    puzzle:
      "000400100000705032032000700001080605070000020503010800008000560650803000007001000",
  },
  {
    tacticId: "unique-rectangle",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "bug-plus-one",
    source: "https://www.sudokuwiki.org/BUG",
    puzzle:
      "200400501001038090030000708070002003060090005040000009004000060620300800810047000",
  },
  {
    tacticId: "3d-medusa",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "aic",
    source:
      "https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper",
    puzzle:
      "001000009080900032002173000020000000000000270014800600000090000000050063190007000",
  },
  {
    tacticId: "nishio",
    source: "teaching example — nishio",
    puzzle:
      "760002009350040008000000001000009007006000080500800030600000000090003700000580002",
  },
];
