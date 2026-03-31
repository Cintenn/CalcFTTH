export const RATIO_TABLE: Array<{ ratio: string; percent: number; loss: number }> = [
  { ratio: "1:99",  percent: 1,  loss: -20.20 },
  { ratio: "2:98",  percent: 2,  loss: -17.19 },
  { ratio: "3:97",  percent: 3,  loss: -15.43 },
  { ratio: "4:96",  percent: 4,  loss: -14.18 },
  { ratio: "5:95",  percent: 5,  loss: -13.21 },
  { ratio: "6:94",  percent: 6,  loss: -12.42 },
  { ratio: "7:93",  percent: 7,  loss: -11.75 },
  { ratio: "8:92",  percent: 8,  loss: -11.17 },
  { ratio: "10:90", percent: 10, loss: -10.20 },
  { ratio: "12:88", percent: 12, loss: -9.41  },
  { ratio: "15:85", percent: 15, loss: -8.44  },
  { ratio: "18:82", percent: 18, loss: -7.65  },
  { ratio: "20:80", percent: 20, loss: -7.19  },
  { ratio: "22:78", percent: 22, loss: -6.78  },
  { ratio: "25:75", percent: 25, loss: -6.22  },
  { ratio: "28:72", percent: 28, loss: -5.73  },
  { ratio: "30:70", percent: 30, loss: -5.43  },
  { ratio: "35:65", percent: 35, loss: -4.76  },
  { ratio: "40:60", percent: 40, loss: -4.18  },
  { ratio: "45:55", percent: 45, loss: -3.67  },
  { ratio: "47:53", percent: 47, loss: -3.48  },
  { ratio: "48:52", percent: 48, loss: -3.49  },
  { ratio: "50:50", percent: 50, loss: -3.21  },
];

export const SPLITTER_LOSS_MAP: Record<string, number> = {
  "1:2":  3.2,
  "1:4":  7.2,
  "1:8":  10.3,
  "1:16": 13.3,
  "1:32": 16.6,
};

export function getClosestRatio(percent: number) {
  return RATIO_TABLE.reduce((prev, curr) =>
    Math.abs(curr.percent - percent) < Math.abs(prev.percent - percent) ? curr : prev
  );
}

export type CalcOutputResult = {
  totalLoss: string;
  outputPower: string;
  outputPowerNum: number;
  status: "GOOD SIGNAL" | "LOW SIGNAL";
  ratioUsed: string;
  ratioPercent: number;
  /** Alias: same as ratioPercent — the small/branch side */
  ratioSmall: number;
  /** 100 - ratioSmall — the large/terusan side */
  ratioLarge: number;
  percentSmall: number;
  percentLarge: number;
  fiberLoss: string;
  accessoriesLoss: string;
  splitterLoss: string;
  ratioLoss: string;
  pBranchSmall: string;
  pBranchLarge: string;
  baseOutput: string;
};

export type CalcParams = {
  laser: number;
  connectors: number;
  splicing: number;
  cable: number;
  splitter: string;
  ratioPercent: number;
};

export function calculateOutputPower(p: CalcParams): CalcOutputResult {
  const fiberLoss = (p.cable / 1000) * 0.35;
  const accessoriesLoss = p.connectors * 0.3 + p.splicing * 0.1;
  
  const baseLoss = fiberLoss + accessoriesLoss;
  const baseOutputNum = p.laser - baseLoss;

  const splitterLossNum = SPLITTER_LOSS_MAP[p.splitter] ?? 0;
  
  const ratioData = getClosestRatio(p.ratioPercent);
  const ratioLossSmall = Math.abs(ratioData.loss);
  const ratioLargePercent = 100 - ratioData.percent;
  const ratioLossLarge = Math.abs(10 * Math.log10(ratioLargePercent / 100));

  const pBranchSmallNum = baseOutputNum - ratioLossSmall - splitterLossNum;
  const pBranchLargeNum = baseOutputNum - ratioLossLarge;
  const totalLossNum = baseLoss + ratioLossSmall + splitterLossNum;

  return {
    totalLoss: totalLossNum.toFixed(2),
    outputPower: pBranchSmallNum.toFixed(2),
    outputPowerNum: pBranchSmallNum,
    status: pBranchSmallNum >= -28 ? "GOOD SIGNAL" : "LOW SIGNAL",
    ratioUsed: ratioData.ratio,
    ratioPercent: ratioData.percent,
    ratioSmall: ratioData.percent,
    ratioLarge: ratioLargePercent,
    percentSmall: ratioData.percent,
    percentLarge: ratioLargePercent,
    fiberLoss: fiberLoss.toFixed(2),
    accessoriesLoss: accessoriesLoss.toFixed(2),
    splitterLoss: splitterLossNum.toFixed(2),
    ratioLoss: ratioLossSmall.toFixed(2),
    pBranchSmall: pBranchSmallNum.toFixed(2),
    pBranchLarge: pBranchLargeNum.toFixed(2),
    baseOutput: baseOutputNum.toFixed(2),
  };
}

export function findBestRatio(
  params: Omit<CalcParams, "ratioPercent">,
  targetPower: number
): CalcOutputResult | null {
  let validCandidates: CalcOutputResult[] = [];
  
  for (const r of RATIO_TABLE) {
    const result = calculateOutputPower({ ...params, ratioPercent: r.percent });
    // Constraint: P_small <= Target
    if (result.outputPowerNum <= targetPower) {
      validCandidates.push(result);
    }
  }

  if (validCandidates.length === 0) {
    return null;
  }

  // Select the LARGEST ratio kecil (which is the last one in the sorted valid candidate set)
  return validCandidates[validCandidates.length - 1];
}

export function parseSignedNumber(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export function isValidSignedInput(val: string): boolean {
  return /^-?\d*\.?\d*$/.test(val);
}
