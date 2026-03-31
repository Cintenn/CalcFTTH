import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { GitMerge, Calculator, RefreshCw } from "lucide-react";
import { SPLITTER_LOSS_MAP, calculateOutputPower, isValidSignedInput, parseSignedNumber, type CalcOutputResult } from "@/lib/ftth";

type Result = {
  odpUtama: CalcOutputResult;
  odpGang: CalcOutputResult[];
  rTerusan: string;
};

const DEFAULT = {
  laser: "7", connector: "4", splicing: "2",
  cable: "1000", cableOdp: "100", odpType: "1:8",
  kebOdp: "3", targetPower: "-20",
};

export default function JalurPercabangan() {
  const [laser, setLaser] = useState(DEFAULT.laser);
  const [connector, setConnector] = useState(DEFAULT.connector);
  const [splicing, setSplicing] = useState(DEFAULT.splicing);
  const [cable, setCable] = useState(DEFAULT.cable);
  const [cableOdp, setCableOdp] = useState(DEFAULT.cableOdp);
  const [odpType, setOdpType] = useState(DEFAULT.odpType);
  const [kebOdp, setKebOdp] = useState(DEFAULT.kebOdp);
  const [targetPower, setTargetPower] = useState(DEFAULT.targetPower);
  const [result, setResult] = useState<Result | null>(null);

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    const laserNum = parseSignedNumber(laser);
    if (laserNum === null) return alert("Invalid Laser Power value");

    const connNum = parseInt(connector) || 0;
    const splNum = parseInt(splicing) || 0;
    const cableNum = parseInt(cable) || 0;
    const cableOdpNum = parseInt(cableOdp) || 0;
    const kebOdpNum = parseInt(kebOdp) || 1;
    const targetNum = parseSignedNumber(targetPower) ?? -20;

    // Calculate ODP Utama using ratio 10% (small branch, large continues)
    const odpUtama = calculateOutputPower({
      laser: laserNum,
      connectors: connNum,
      splicing: splNum,
      cable: cableNum,
      splitter: odpType,
      ratioPercent: 10,
    });

    // Each gang ODP has extra cable loss
    const odpGang: CalcOutputResult[] = [];
    for (let i = 1; i <= Math.max(1, kebOdpNum); i++) {
      const gangResult = calculateOutputPower({
        laser: odpUtama.outputPowerNum,
        connectors: 2,
        splicing: 1,
        cable: cableOdpNum * i,
        splitter: odpType,
        ratioPercent: 50,
      });
      odpGang.push(gangResult);
    }

    // R Terusan: power that continues on the main line (large ratio side = 90%)
    const rTerusanNum = odpUtama.outputPowerNum;
    const rTerusan = rTerusanNum.toFixed(2);

    setResult({ odpUtama, odpGang, rTerusan });
  };

  const handleReset = () => {
    setLaser(DEFAULT.laser);
    setConnector(DEFAULT.connector);
    setSplicing(DEFAULT.splicing);
    setCable(DEFAULT.cable);
    setCableOdp(DEFAULT.cableOdp);
    setOdpType(DEFAULT.odpType);
    setKebOdp(DEFAULT.kebOdp);
    setTargetPower(DEFAULT.targetPower);
    setResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Card className="lg:col-span-6 shadow-md border-border/50 h-max">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-primary" /> Network Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleProcess} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Laser Power (dBm)</Label>
                <Input type="text" inputMode="decimal" value={laser}
                  onChange={e => isValidSignedInput(e.target.value) && setLaser(e.target.value)} placeholder="e.g. 7" />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Target Power (dBm)</Label>
                <Input type="text" inputMode="decimal" className="border-primary/50" value={targetPower}
                  onChange={e => isValidSignedInput(e.target.value) && setTargetPower(e.target.value)} placeholder="e.g. -20" />
              </div>
              <div className="space-y-2">
                <Label>Connector (pcs)</Label>
                <Input type="number" min="0" value={connector} onChange={e => setConnector(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Splicing (pcs)</Label>
                <Input type="number" min="0" value={splicing} onChange={e => setSplicing(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>P. Kabel Utama (m)</Label>
                <Input type="number" min="0" value={cable} onChange={e => setCable(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>P. Kabel ke Gang (m)</Label>
                <Input type="number" min="0" value={cableOdp} onChange={e => setCableOdp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Keb. ODP / Gang</Label>
                <Input type="number" min="1" max="8" value={kebOdp} onChange={e => setKebOdp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type ODP</Label>
                <Select value={odpType} onChange={e => setOdpType(e.target.value)}>
                  {Object.keys(SPLITTER_LOSS_MAP).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button type="submit" className="flex-1">
                <Calculator className="w-4 h-4 mr-2" /> Process Branching
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="w-12">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-6">
        {result ? (
          <div className="space-y-4">
            <Card className="border-primary bg-primary/5 shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-primary">Branch Calculation Results</h3>
                  <Badge variant={result.odpUtama.status === "GOOD SIGNAL" ? "success" : "destructive"}>
                    {result.odpUtama.status === "GOOD SIGNAL" ? "✓ GOOD SIGNAL" : "✗ LOW SIGNAL"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center bg-background rounded-xl p-4 border">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Ratio Kecil</div>
                    <div className="text-3xl font-bold font-mono">{result.odpUtama.ratioPercent}%</div>
                  </div>
                  <div className="text-center bg-background rounded-xl p-4 border">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Ratio Besar</div>
                    <div className="text-3xl font-bold font-mono text-primary">{100 - result.odpUtama.ratioPercent}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="border-b pb-3 bg-muted/30">
                <CardTitle className="text-base">Outputs Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  <div className="flex justify-between p-4 bg-muted/10">
                    <span className="font-semibold text-muted-foreground">ODP Utama Output</span>
                    <span className="font-mono font-bold text-lg">{result.odpUtama.outputPower} dBm</span>
                  </div>
                  {result.odpGang.map((g, idx) => (
                    <div key={idx} className="flex justify-between p-4">
                      <span className="font-semibold">ODP Gang {idx + 1}</span>
                      <span className={cn("font-mono font-bold text-lg", g.status === "GOOD SIGNAL" ? "text-green-600" : "text-destructive")}>
                        {g.outputPower} dBm
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between p-4 bg-primary/5 text-primary">
                    <span className="font-bold">R Terusan (after ratio)</span>
                    <span className="font-mono font-bold text-lg">{result.rTerusan} dBm</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed bg-transparent shadow-none">
            <div className="text-center text-muted-foreground opacity-50">
              <GitMerge className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Submit parameters to visualize branching loss</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
