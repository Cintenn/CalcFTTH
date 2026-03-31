import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { RefreshCw, Calculator, Target, Info, AlertTriangle } from "lucide-react";
import { SPLITTER_LOSS_MAP, findBestRatio, isValidSignedInput, parseSignedNumber, type CalcOutputResult } from "@/lib/ftth";

const DEFAULT = { laser: "7", connectors: "4", splicing: "2", cable: "1000", splitter: "1:8", targetPower: "-20" };

export default function SplitterRatio() {
  const [laser, setLaser] = useState(DEFAULT.laser);
  const [connectors, setConnectors] = useState(DEFAULT.connectors);
  const [splicing, setSplicing] = useState(DEFAULT.splicing);
  const [cable, setCable] = useState(DEFAULT.cable);
  const [splitter, setSplitter] = useState(DEFAULT.splitter);
  const [targetPower, setTargetPower] = useState(DEFAULT.targetPower);
  const [result, setResult] = useState<CalcOutputResult | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const laserNum = parseSignedNumber(laser);
    const targetNum = parseSignedNumber(targetPower);
    if (laserNum === null) return alert("Invalid Laser Power value");
    if (targetNum === null) return alert("Invalid Target Power value");

    const res = findBestRatio(
      { laser: laserNum, connectors: parseInt(connectors) || 0, splicing: parseInt(splicing) || 0, cable: parseInt(cable) || 0, splitter },
      targetNum
    );
    
    if (!res) {
      setResult(null);
      setWarning("Target output cannot be achieved with current parameters");
    } else {
      setResult(res);
      setWarning(null);
    }
  };

  const handleReset = () => {
    setLaser(DEFAULT.laser);
    setConnectors(DEFAULT.connectors);
    setSplicing(DEFAULT.splicing);
    setCable(DEFAULT.cable);
    setSplitter(DEFAULT.splitter);
    setTargetPower(DEFAULT.targetPower);
    setResult(null);
    setWarning(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Card className="lg:col-span-7 shadow-lg border-border/50">
        <CardHeader className="bg-muted/30">
          <CardTitle>Determine Splitter Ratio</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Laser Power (dBm)</Label>
                <Input
                  type="text" inputMode="decimal"
                  value={laser}
                  onChange={e => isValidSignedInput(e.target.value) && setLaser(e.target.value)}
                  placeholder="e.g. 7 or -3"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary flex items-center gap-2">
                  <Target className="w-4 h-4" /> Target Output Power (dBm)
                </Label>
                <Input
                  type="text" inputMode="decimal"
                  className="border-primary/50 bg-primary/5"
                  value={targetPower}
                  onChange={e => isValidSignedInput(e.target.value) && setTargetPower(e.target.value)}
                  placeholder="e.g. -20"
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
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" className="flex-1">
                <Calculator className="w-4 h-4 mr-2" /> Find Best Ratio
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="w-32">
                <RefreshCw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-5 space-y-6">
        <Card className="shadow-lg border-primary/20 bg-primary/5 h-full">
          <CardHeader className="border-b border-primary/10 pb-4">
            <CardTitle className="text-primary flex items-center justify-between">
              Recommendation
              {result && (
                <Badge variant={result.status === "GOOD SIGNAL" ? "success" : "destructive"} className="text-sm px-3 py-1">
                  {result.status === "GOOD SIGNAL" ? "✓ GOOD SIGNAL" : "✗ LOW SIGNAL"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            {warning ? (
              <div className="p-8 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-center shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-80 text-destructive" />
                <p className="font-bold text-lg mb-2">{warning}</p>
                <p className="text-sm opacity-90 max-w-[280px]">Suggestion: Reduce splitter, reduce distance, or increase laser power.</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Recommended Ratio + Split Ratio badge */}
                <div className="text-center p-6 bg-background rounded-2xl border border-border shadow-md">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">Recommended Ratio</p>
                  <p className="text-5xl font-black font-mono text-primary">{result.ratioUsed}</p>
                  
                  <div className="mt-4 flex flex-col items-center">
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                      <span className="text-primary">Ratio Kecil: {result.ratioSmall}%</span>
                      <span className="text-border">|</span>
                      <span>Ratio Besar: {result.ratioLarge}%</span>
                    </div>
                    
                    {/* Visual Ratio Bar */}
                    <div className="mt-3 w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden flex mb-4">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${result.ratioSmall}%` }} 
                      />
                      <div 
                        className="h-full bg-muted-foreground/30" 
                        style={{ width: `${result.ratioLarge}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground italic mb-1">Result is optimized to stay below target output power</p>
                    <p className="text-sm font-semibold text-foreground">
                      Margin: <span className="font-mono text-primary">{(parseFloat(targetPower) - result.outputPowerNum).toFixed(2)} dB</span>
                    </p>
                  </div>
                </div>

                {/* Ratio Kecil / Ratio Besar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background rounded-xl p-4 border text-center shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ratio Kecil</p>
                    <p className="text-2xl font-bold font-mono text-primary">{result.ratioSmall}%</p>
                    <p className="text-xs text-muted-foreground mt-1">(Small Portion)</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border text-center shadow-sm">
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

                {/* Output Power */}
                <div className="flex flex-col p-4 bg-background rounded-xl border shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium w-3/4">Effective Output Power (Worst Case)</span>
                    <span className={cn(
                      "text-xl font-bold font-mono text-right w-1/4",
                      result.status === "GOOD SIGNAL" ? "text-green-600" : "text-destructive"
                    )}>
                      {result.pBranchSmall} <span className="text-sm font-sans text-muted-foreground">dBm</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-left italic">
                    Based on worst-case (smallest splitter branch)
                  </p>
                </div>

                {/* Total Loss */}
                <div className="flex justify-between items-center p-4 bg-background rounded-xl border">
                  <span className="font-medium text-muted-foreground">Total Loss</span>
                  <span className="text-xl font-bold font-mono">{result.totalLoss} <span className="text-sm font-sans text-muted-foreground">dB</span></span>
                </div>

                {/* Loss breakdown */}
                <div className="p-3 bg-muted/30 rounded-xl border text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Fiber + Accessories + Ratio (Small) + Splitter Average Loss
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {result.fiberLoss} + {result.accessoriesLoss} + {result.ratioLoss} + {result.splitterLoss} dB
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-background/50">
                <Target className="w-12 h-12 mb-3 opacity-20" />
                <p>Define target power to find best ratio</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
