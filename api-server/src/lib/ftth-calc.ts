export const SPLITTER_LOSS: Record<string, number> = {
  "1:2": 3.2,
  "1:4": 7.2,
  "1:8": 10.3,
  "1:16": 13.3,
  "1:32": 16.6,
};

export const OPTICAL_RATIO_TABLE: Array<{ ratio: string; percent: number; loss: number }> = [
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

export function getClosestRatio(percent: number): { ratio: string; percent: number; loss: number } {
  return OPTICAL_RATIO_TABLE.reduce((prev, curr) =>
    Math.abs(curr.percent - percent) < Math.abs(prev.percent - percent) ? curr : prev
  );
}

export function getSplitterLoss(odpType: string): number {
  return SPLITTER_LOSS[odpType] ?? 0;
}

export function calcFiberLoss(cableLengthM: number): number {
  return (cableLengthM / 1000) * 0.35;
}

export function calcAccessoriesLoss(connector: number, splicing: number): number {
  return connector * 0.3 + splicing * 0.1;
}

export function getStatus(outputPower: number): "GOOD" | "BAD" {
  return outputPower >= -28 ? "GOOD" : "BAD";
}

export function r(n: number): number {
  return parseFloat(n.toFixed(4));
}

export function calcFindRatio(
  laserPower: number,
  connector: number,
  splicing: number,
  cableLength: number,
  odpType: string,
  ratioSmall: number
) {
  const fiberLoss = calcFiberLoss(cableLength);
  const accessoriesLoss = calcAccessoriesLoss(connector, splicing);
  const splitterLoss = getSplitterLoss(odpType);
  const ratioEntry = getClosestRatio(ratioSmall);
  const ratioLoss = Math.abs(ratioEntry.loss);

  const totalLoss = fiberLoss + accessoriesLoss + splitterLoss + ratioLoss;
  const lossOdp = splitterLoss + ratioLoss;
  const passingLoss = fiberLoss + accessoriesLoss;
  const finalPower = laserPower - totalLoss;

  return {
    lossOdp: r(lossOdp),
    passingLoss: r(passingLoss),
    finalPower: r(finalPower),
    status: getStatus(finalPower),
    totalLoss: r(totalLoss),
    fiberLoss: r(fiberLoss),
    accessoriesLoss: r(accessoriesLoss),
    splitterLoss: r(splitterLoss),
    ratioLoss: r(ratioLoss),
  };
}

export function calcSplitterRatio(
  laserPower: number,
  connector: number,
  splicing: number,
  cableLength: number,
  odpType: string,
  targetPower: number
) {
  const fiberLoss = calcFiberLoss(cableLength);
  const accessoriesLoss = calcAccessoriesLoss(connector, splicing);
  const splitterLoss = getSplitterLoss(odpType);

  const allowedRatioLoss = laserPower - targetPower - fiberLoss - accessoriesLoss - splitterLoss;

  // Find best ratio: the largest ratio (highest %) whose loss <= allowedRatioLoss
  let bestEntry = OPTICAL_RATIO_TABLE[0];
  for (const entry of OPTICAL_RATIO_TABLE) {
    if (Math.abs(entry.loss) <= allowedRatioLoss) {
      bestEntry = entry;
    }
  }

  const ratioLoss = Math.abs(bestEntry.loss);
  const totalLoss = fiberLoss + accessoriesLoss + splitterLoss + ratioLoss;
  const outputPower = laserPower - totalLoss;

  const parts = bestEntry.ratio.split(":");
  return {
    recommendedRatio: bestEntry.ratio,
    outputPower: r(outputPower),
    totalLoss: r(totalLoss),
    status: getStatus(outputPower),
    ratioSmall: bestEntry.percent,
    ratioLarge: 100 - bestEntry.percent,
  };
}

export function calcJalurLurus(
  laserPower: number,
  rows: Array<{ no: number; connector: number; splicing: number; cable: number; odpType: string }>
) {
  let remainingPower = laserPower;
  const results = [];

  for (const row of rows) {
    if (!row.odpType || row.odpType === "") {
      results.push({
        no: row.no,
        ratio: "-",
        output: 0,
        sisaLaser: r(remainingPower),
        status: "BAD" as const,
      });
      continue;
    }

    const fiberLoss = calcFiberLoss(row.cable);
    const accessoriesLoss = calcAccessoriesLoss(row.connector, row.splicing);
    const splitterLoss = getSplitterLoss(row.odpType);
    const passLoss = fiberLoss + accessoriesLoss;
    const outputPower = remainingPower - passLoss - splitterLoss;

    results.push({
      no: row.no,
      ratio: row.odpType,
      output: r(outputPower),
      sisaLaser: r(remainingPower - passLoss),
      status: getStatus(outputPower),
    });

    remainingPower = remainingPower - passLoss;
  }

  return { rows: results };
}

export function calcJalurPercabangan(
  laserPower: number,
  connector: number,
  splicing: number,
  cable: number,
  cableOdp: number,
  odpType: string,
  kebOdp: number
) {
  const fiberLoss = calcFiberLoss(cable);
  const accessoriesLoss = calcAccessoriesLoss(connector, splicing);
  const splitterLoss = getSplitterLoss(odpType);
  const fiberOdpLoss = calcFiberLoss(cableOdp);

  const odpUtama = laserPower - fiberLoss - accessoriesLoss - splitterLoss;
  const odp1 = odpUtama - fiberOdpLoss;
  const odp2 = odpUtama - fiberOdpLoss * 2;
  const odp3 = kebOdp >= 3 ? odpUtama - fiberOdpLoss * 3 : odpUtama - fiberOdpLoss * 2;

  // Ratio: use 10:90 split for main/pass
  const ratioEntry = getClosestRatio(10);
  const ratioKecil = ratioEntry.percent;
  const ratioBesar = 100 - ratioKecil;
  const rTerusan = r(odpUtama - Math.abs(ratioEntry.loss));

  return {
    odpUtama: r(odpUtama),
    odp1: r(odp1),
    odp2: r(odp2),
    odp3: r(odp3),
    ratioKecil,
    ratioBesar,
    rTerusan,
    status: getStatus(odpUtama),
  };
}

export function calcMixRatio(
  laserPower: number,
  connector: number,
  splicing: number,
  cableLength: number,
  customRatio: string,
  odc1Ratio: string,
  odc2Ratio: string,
  odc3Ratio: string,
  odpType: string
) {
  const fiberLoss = calcFiberLoss(cableLength);
  const accessoriesLoss = calcAccessoriesLoss(connector, splicing);

  // Parse ratio string "30:70" -> small=30, look up closest
  const parseRatioSmall = (ratioStr: string): number => {
    if (!ratioStr) return 50;
    // If it's "1:8" style (splitter) use splitter loss logic
    if (SPLITTER_LOSS[ratioStr] !== undefined) return 50;
    const parts = ratioStr.split(":");
    return parseInt(parts[0]) || 50;
  };

  const getRatioOrSplitterLoss = (ratioStr: string): number => {
    if (SPLITTER_LOSS[ratioStr] !== undefined) {
      return SPLITTER_LOSS[ratioStr];
    }
    const small = parseRatioSmall(ratioStr);
    return Math.abs(getClosestRatio(small).loss);
  };

  const baseLoss = fiberLoss + accessoriesLoss;
  const customLoss = getRatioOrSplitterLoss(customRatio);
  const baseOutput = laserPower - baseLoss - customLoss;

  const odc1Loss = getRatioOrSplitterLoss(odc1Ratio);
  const outputOdc1 = baseOutput - odc1Loss;

  const odc2Loss = getRatioOrSplitterLoss(odc2Ratio);
  const outputOdc2 = outputOdc1 - odc2Loss;

  const odc3Loss = getRatioOrSplitterLoss(odc3Ratio);
  const outputOdc3 = outputOdc2 - odc3Loss;

  const odpLoss = getSplitterLoss(odpType);
  const finalOutput = outputOdc3 - odpLoss;
  const totalLoss = laserPower - finalOutput;
  const remainingLaserPercent = parseFloat(Math.max(0, ((finalOutput + 28) / (laserPower + 28)) * 100).toFixed(2));

  return {
    outputOdc1: r(outputOdc1),
    outputOdc2: r(outputOdc2),
    outputOdc3: r(outputOdc3),
    finalOutput: r(finalOutput),
    remainingLaserPercent,
    totalLoss: r(totalLoss),
    status: getStatus(finalOutput),
  };
}
