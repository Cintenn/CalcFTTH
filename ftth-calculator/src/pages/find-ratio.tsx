import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { RefreshCw, Calculator, Info } from "lucide-react";
import { RATIO_TABLE, SPLITTER_LOSS_MAP, calculateOutputPower, isValidSignedInput, parseSignedNumber, type CalcOutputResult } from "@/lib/ftth";

const DEFAULT = { laser: "7", connectors: "4", splicing: "2", cable: "1000", splitter: "1:8", ratioPercent: 10 };

export default function FindRatio() {
  const [laser, setLaser] = useState(DEFAULT.laser);
  const [connectors, setConnectors] = useState(DEFAULT.connectors);
  const [splicing, setSplicing] = useState(DEFAULT.splicing);
  const [cable, setCable] = useState(DEFAULT.cable);
  const [splitter, setSplitter] = useState(DEFAULT.splitter);
  const [ratioPercent, setRatioPercent] = useState(DEFAULT.ratioPercent);
  const [ratioLarge, setRatioLarge] = useState(100 - DEFAULT.ratioPercent);
  const [result, setResult] = useState<CalcOutputResult | null>(null);

  useEffect(() => {
    setRatioLarge(100 - ratioPercent);
  }, [ratioPercent]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const laserNum = parseSignedNumber(laser);
    if (laserNum === null) return alert("Invalid Laser Power value");

    const res = calculateOutputPower({
      laser: laserNum,
      connectors: parseInt(connectors) || 0,
      splicing: parseInt(splicing) || 0,
      cable: parseInt(cable) || 0,
      splitter,
      ratioPercent,
    });
    setResult(res);
  };

  const handleReset = () => {
    setLaser(DEFAULT.laser);
    setConnectors(DEFAULT.connectors);
    setSplicing(DEFAULT.splicing);
    setCable(DEFAULT.cable);
    setSplitter(DEFAULT.splitter);
    setRatioPercent(DEFAULT.ratioPercent);
    setResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Card className="lg:col-span-7 shadow-lg border-border/50">
        <CardHeader className="bg-muted/30">
          <CardTitle>Input Parameters</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Laser Power (dBm)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={laser}
                  onChange={e => isValidSignedInput(e.target.value) && setLaser(e.target.value)}
                  placeholder="e.g. 7 or -3"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Connectors (pcs)</Label>
                <Input type="number" min="0" value={connectors} onChange={e => setConnectors(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Splicing (pcs)</Label>
                <Input type="number" min="0" value={splicing} onChange={e => setSplicing(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cable Length (meter)</Label>
                <Input type="number" min="0" value={cable} onChange={e => setCable(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5" title="Splitter Average Loss is a standard estimated loss value based on typical splitter performance (e.g. 1:8, 1:16). Actual field values may vary.">
                  ODP Type (Splitter Average) <Info className="w-3 h-3 text-muted-foreground opacity-70 cursor-help" />
                </Label>
                <Select value={splitter} onChange={e => setSplitter(e.target.value)}>
                  {Object.entries(SPLITTER_LOSS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{k} (−{v} dB)</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ratio Small (%)</Label>
                <Select value={ratioPercent} onChange={e => setRatioPercent(parseInt(e.target.value))}>
                  {RATIO_TABLE.map(r => (
                    <option key={r.percent} value={r.percent}>{r.ratio} ({r.percent}%)</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ratio Large (%) — Auto</Label>
                <Input type="text" value={ratioLarge} disabled className="bg-muted text-muted-foreground" />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" className="flex-1">
                <Calculator className="w-4 h-4 mr-2" /> Calculate Ratio
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="w-32">
                <RefreshCw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-5 space-y-6">
        <Card className="shadow-lg border-primary/20 bg-primary/5">
          <CardHeader className="border-b border-primary/10 pb-4">
            <CardTitle className="text-primary flex items-center justify-between">
              Calculation Results
              {result && (
                <Badge variant={result.status === "GOOD SIGNAL" ? "success" : "destructive"} className="text-sm px-3 py-1">
                  {result.status === "GOOD SIGNAL" ? "✓ GOOD SIGNAL" : "✗ LOW SIGNAL"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {result ? (
              <div className="space-y-4">
                {/* Output Power */}
                <div className="flex flex-col p-4 bg-background rounded-xl border shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium w-3/4">Effective Output Power (Worst Case)</span>
                    <span className={cn(
                      "text-2xl font-bold font-mono text-right w-1/4",
                      result.status === "GOOD SIGNAL" ? "text-green-600" : "text-destructive"
                    )}>
                      {result.pBranchSmall} <span className="text-sm font-sans text-muted-foreground">dBm</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-left italic">
                    Based on worst-case (smallest splitter branch)
                  </p>
                </div>

                {/* Split Ratio label */}
                <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Split Ratio</p>
                  <p className="text-3xl font-black font-mono text-primary">
                    {result.ratioSmall}:{result.ratioLarge}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    <span className="text-primary">Ratio Kecil:</span> {result.ratioSmall}% &nbsp;|&nbsp; <span>Ratio Besar:</span> {result.ratioLarge}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Distribution: {result.ratioSmall}% (Small) / {result.ratioLarge}% (Large)
                  </p>
                </div>

                {/* Ratio Kecil / Ratio Besar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background rounded-xl p-4 border text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ratio Kecil</p>
                    <p className="text-2xl font-bold font-mono text-primary">{result.ratioSmall}%</p>
                    <p className="text-xs text-muted-foreground mt-1">(Small Portion)</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ratio Besar</p>
                    <p className="text-2xl font-bold font-mono text-foreground">{result.ratioLarge}%</p>
                    <p className="text-xs text-muted-foreground mt-1">(Large Portion)</p>
                  </div>
                </div>

                {/* Branch Outputs */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground text-center mb-2 uppercase tracking-wider">Power Distribution After Splitter</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background rounded-xl p-4 border flex flex-col items-center justify-center border-destructive/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Output Ratio Kecil</p>
                      <p className="text-xl font-bold font-mono text-destructive">{result.pBranchSmall} <span className="text-xs font-sans font-normal text-muted-foreground">dBm</span></p>
                      <p className="text-[10px] text-muted-foreground mt-1 italic text-center leading-tight">Includes splitter<br/>(client side)</p>
                    </div>
                    <div className="bg-background rounded-xl p-4 border flex flex-col items-center justify-center border-green-500/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Output Ratio Besar</p>
                      <p className="text-xl font-bold font-mono text-green-600">{result.pBranchLarge} <span className="text-xs font-sans font-normal text-muted-foreground">dBm</span></p>
                      <p className="text-[10px] text-muted-foreground mt-1 italic text-center leading-tight">Continues to next distribution<br/>(no splitter applied)</p>
                    </div>
                  </div>
                </div>

                {/* Loss breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Loss (dB)", value: result.totalLoss },
                    { label: "Fiber Loss (dB)", value: result.fiberLoss },
                    { label: "Accessories Loss (dB)", value: result.accessoriesLoss },
                    { label: "Ratio Loss (Small) (dB)", value: result.ratioLoss },
                    { label: "Splitter Avg Loss (dB)", value: result.splitterLoss },
                  ].map(({ label, value }, idx) => (
                    <div key={idx} className="bg-background p-3 rounded-xl border border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">{label}</div>
                      <div className="text-lg font-bold font-mono">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <Calculator className="w-12 h-12 mb-3 opacity-20" />
                <p>Fill in the form and click Calculate Ratio</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
