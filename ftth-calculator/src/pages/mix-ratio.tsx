import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Calculator, Settings, RefreshCw } from "lucide-react";
import { RATIO_TABLE, SPLITTER_LOSS_MAP, calculateOutputPower, isValidSignedInput, parseSignedNumber, type CalcOutputResult } from "@/lib/ftth";

type Result = {
  afterMaster: CalcOutputResult;
  afterOdc1: CalcOutputResult;
  afterOdc2: CalcOutputResult;
  afterOdc3: CalcOutputResult;
  finalOutput: CalcOutputResult;
  totalLoss: string;
};

const ODC_OPTIONS = [
  ...Object.keys(SPLITTER_LOSS_MAP).map(k => ({ value: k, label: `${k} (Splitter)` })),
  ...RATIO_TABLE.map(r => ({ value: `r:${r.percent}`, label: `${r.ratio} (Ratio ${r.percent}%)` })),
];

function getLossForOption(val: string): number {
  if (SPLITTER_LOSS_MAP[val] !== undefined) return SPLITTER_LOSS_MAP[val];
  if (val.startsWith("r:")) {
    const pct = parseInt(val.slice(2));
    const entry = RATIO_TABLE.reduce((p, c) =>
      Math.abs(c.percent - pct) < Math.abs(p.percent - pct) ? c : p
    );
    return Math.abs(entry.loss);
  }
  return 0;
}

const DEFAULT = {
  laser: "7", connector: "4", splicing: "2", cable: "1000",
  masterRatio: "r:30", odc1: "1:8", odc2: "1:8", odc3: "1:8", odpType: "1:8",
};

export default function MixRatio() {
  const [laser, setLaser] = useState(DEFAULT.laser);
  const [connector, setConnector] = useState(DEFAULT.connector);
  const [splicing, setSplicing] = useState(DEFAULT.splicing);
  const [cable, setCable] = useState(DEFAULT.cable);
  const [masterRatio, setMasterRatio] = useState(DEFAULT.masterRatio);
  const [odc1, setOdc1] = useState(DEFAULT.odc1);
  const [odc2, setOdc2] = useState(DEFAULT.odc2);
  const [odc3, setOdc3] = useState(DEFAULT.odc3);
  const [odpType, setOdpType] = useState(DEFAULT.odpType);
  const [result, setResult] = useState<Result | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const laserNum = parseSignedNumber(laser);
    if (laserNum === null) return alert("Invalid Laser Power value");

    const connNum = parseInt(connector) || 0;
    const splNum = parseInt(splicing) || 0;
    const cableNum = parseInt(cable) || 0;

    // Determine ratioPercent for master; if it's a splitter type, use 50% ratio approx
    const getMasterRatioPercent = () => {
      if (masterRatio.startsWith("r:")) return parseInt(masterRatio.slice(2));
      return 50;
    };

    const afterMaster = calculateOutputPower({
      laser: laserNum,
      connectors: connNum,
      splicing: splNum,
      cable: cableNum,
      splitter: masterRatio.startsWith("r:") ? "1:8" : masterRatio,
      ratioPercent: getMasterRatioPercent(),
    });

    // If master is a ratio type, override splitter loss with the correct value
    let masterAdjustedPower = afterMaster.outputPowerNum;
    if (masterRatio.startsWith("r:")) {
      const fiberLoss = (cableNum / 1000) * 0.35;
      const accLoss = connNum * 0.3 + splNum * 0.1;
      const ratioLossVal = getLossForOption(masterRatio);
      masterAdjustedPower = laserNum - fiberLoss - accLoss - ratioLossVal;
    }

    const afterOdc1 = calculateOutputPower({ laser: masterAdjustedPower, connectors: 0, splicing: 0, cable: 0, splitter: odc1.startsWith("r:") ? "1:8" : odc1, ratioPercent: odc1.startsWith("r:") ? parseInt(odc1.slice(2)) : 50 });
    let p1 = afterOdc1.outputPowerNum;
    if (odc1.startsWith("r:")) p1 = masterAdjustedPower - getLossForOption(odc1);

    const afterOdc2 = calculateOutputPower({ laser: p1, connectors: 0, splicing: 0, cable: 0, splitter: odc2.startsWith("r:") ? "1:8" : odc2, ratioPercent: odc2.startsWith("r:") ? parseInt(odc2.slice(2)) : 50 });
    let p2 = afterOdc2.outputPowerNum;
    if (odc2.startsWith("r:")) p2 = p1 - getLossForOption(odc2);

    const afterOdc3 = calculateOutputPower({ laser: p2, connectors: 0, splicing: 0, cable: 0, splitter: odc3.startsWith("r:") ? "1:8" : odc3, ratioPercent: odc3.startsWith("r:") ? parseInt(odc3.slice(2)) : 50 });
    let p3 = afterOdc3.outputPowerNum;
    if (odc3.startsWith("r:")) p3 = p2 - getLossForOption(odc3);

    const odpLoss = SPLITTER_LOSS_MAP[odpType] ?? 0;
    const finalPowerNum = p3 - odpLoss;

    const finalOutput = { ...afterOdc3, outputPower: finalPowerNum.toFixed(2), outputPowerNum: finalPowerNum, status: (finalPowerNum >= -28 ? "GOOD SIGNAL" : "LOW SIGNAL") as "GOOD SIGNAL" | "LOW SIGNAL" };
    const totalLoss = (laserNum - finalPowerNum).toFixed(2);

    setResult({
      afterMaster: { ...afterMaster, outputPower: masterAdjustedPower.toFixed(2), outputPowerNum: masterAdjustedPower },
      afterOdc1: { ...afterOdc1, outputPower: p1.toFixed(2), outputPowerNum: p1 },
      afterOdc2: { ...afterOdc2, outputPower: p2.toFixed(2), outputPowerNum: p2 },
      afterOdc3: { ...afterOdc3, outputPower: p3.toFixed(2), outputPowerNum: p3 },
      finalOutput,
      totalLoss,
    });
  };

  const handleReset = () => {
    setLaser(DEFAULT.laser);
    setConnector(DEFAULT.connector);
    setSplicing(DEFAULT.splicing);
    setCable(DEFAULT.cable);
    setMasterRatio(DEFAULT.masterRatio);
    setOdc1(DEFAULT.odc1);
    setOdc2(DEFAULT.odc2);
    setOdc3(DEFAULT.odc3);
    setOdpType(DEFAULT.odpType);
    setResult(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <Card className="xl:col-span-8 shadow-md border-border/50 h-max">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Advanced Mix Ratio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border/50">
              <div className="space-y-2">
                <Label>Sumber Laser (dBm)</Label>
                <Input type="text" inputMode="decimal" value={laser}
                  onChange={e => isValidSignedInput(e.target.value) && setLaser(e.target.value)} placeholder="e.g. 7" />
              </div>
              <div className="space-y-2">
                <Label>Konektor (pcs)</Label>
                <Input type="number" min="0" value={connector} onChange={e => setConnector(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Splicing (pcs)</Label>
                <Input type="number" min="0" value={splicing} onChange={e => setSplicing(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kabel (m)</Label>
                <Input type="number" min="0" value={cable} onChange={e => setCable(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold border-b pb-2">Network Splitters / Ratio Chain</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-primary">Rasio Master</Label>
                  <Select className="border-primary/50" value={masterRatio} onChange={e => setMasterRatio(e.target.value)}>
                    {RATIO_TABLE.map(r => (
                      <option key={r.ratio} value={`r:${r.percent}`}>{r.ratio} ({r.percent}%)</option>
                    ))}
                  </Select>
                </div>
                {[
                  { label: "ODC 1", val: odc1, set: setOdc1 },
                  { label: "ODC 2", val: odc2, set: setOdc2 },
                  { label: "ODC 3", val: odc3, set: setOdc3 },
                ].map(({ label, val, set }) => (
                  <div key={label} className="space-y-2">
                    <Label>{label}</Label>
                    <Select value={val} onChange={e => set(e.target.value)}>
                      {ODC_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </Select>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>ODP Final</Label>
                  <Select value={odpType} onChange={e => setOdpType(e.target.value)}>
                    {Object.keys(SPLITTER_LOSS_MAP).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1 h-12">
                <Calculator className="w-5 h-5 mr-2" /> Calculate Mix Topology
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="h-12 px-4">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="xl:col-span-4">
        {result ? (
          <Card className="border-primary bg-primary/5 shadow-xl sticky top-24">
            <CardHeader className="border-b border-primary/10 bg-primary/5 pb-4">
              <CardTitle className="text-primary flex items-center justify-between">
                Topology Output
                <Badge variant={result.finalOutput.status === "GOOD SIGNAL" ? "success" : "destructive"} className="text-sm">
                  {result.finalOutput.status === "GOOD SIGNAL" ? "✓ GOOD" : "✗ LOW"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                {[
                  { label: "Setelah Master Ratio", val: result.afterMaster.outputPower },
                  { label: "Setelah ODC 1", val: result.afterOdc1.outputPower },
                  { label: "Setelah ODC 2", val: result.afterOdc2.outputPower },
                  { label: "Setelah ODC 3", val: result.afterOdc3.outputPower },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center bg-background p-3 rounded-lg border">
                    <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                    <span className="font-mono font-bold">{val} dBm</span>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-background rounded-xl border-2 border-primary text-center shadow-lg">
                <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">Hasil Keluaran</div>
                <div className={cn("text-4xl font-black font-mono", result.finalOutput.status === "GOOD SIGNAL" ? "text-green-600" : "text-destructive")}>
                  {result.finalOutput.outputPower}
                  <span className="text-lg font-sans text-muted-foreground ml-1">dBm</span>
                </div>
              </div>

              <div className="bg-background p-3 rounded-lg border text-center">
                <div className="text-xs text-muted-foreground mb-1">Total Loss (dB)</div>
                <div className="font-bold font-mono text-lg">{result.totalLoss}</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed bg-transparent shadow-none">
            <div className="text-center text-muted-foreground opacity-50">
              <Settings className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Awaiting mix ratio configuration</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
