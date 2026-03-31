import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Calculator, Zap, RefreshCw } from "lucide-react";
import { SPLITTER_LOSS_MAP, calculateOutputPower, isValidSignedInput, parseSignedNumber } from "@/lib/ftth";

type RowInput = { connector: string; splicing: string; cable: string; odpType: string };
type RowResult = { no: number; ratio: string; output: string; sisaLaser: string; status: "GOOD SIGNAL" | "LOW SIGNAL" };

const EMPTY_ROW = (): RowInput => ({ connector: "2", splicing: "2", cable: "200", odpType: "1:8" });

export default function JalurLurus() {
  const [laser, setLaser] = useState("7");
  const [targetPower, setTargetPower] = useState("-20");
  const [rows, setRows] = useState<RowInput[]>(Array.from({ length: 8 }, EMPTY_ROW));
  const [results, setResults] = useState<RowResult[] | null>(null);

  const updateRow = (index: number, field: keyof RowInput, value: string) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    const laserNum = parseSignedNumber(laser);
    if (laserNum === null) return alert("Invalid Laser Power value");

    let remainingPower = laserNum;
    const res: RowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fiberLoss = (parseInt(row.cable) || 0) / 1000 * 0.35;
      const accessoriesLoss = (parseInt(row.connector) || 0) * 0.3 + (parseInt(row.splicing) || 0) * 0.1;
      const splitterLoss = SPLITTER_LOSS_MAP[row.odpType] ?? 0;
      const passLoss = fiberLoss + accessoriesLoss;
      const output = remainingPower - passLoss - splitterLoss;
      const sisaLaser = remainingPower - passLoss;

      res.push({
        no: i + 1,
        ratio: row.odpType,
        output: output.toFixed(2),
        sisaLaser: sisaLaser.toFixed(2),
        status: output >= -28 ? "GOOD SIGNAL" : "LOW SIGNAL",
      });

      remainingPower = sisaLaser;
    }

    setResults(res);
  };

  const handleReset = () => {
    setRows(Array.from({ length: 8 }, EMPTY_ROW));
    setResults(null);
    setLaser("7");
    setTargetPower("-20");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleProcess}>
        <Card className="shadow-md border-border/50 mb-6">
          <CardHeader className="bg-muted/30 flex flex-row items-center justify-between pb-4 flex-wrap gap-3">
            <CardTitle>Jalur Lurus Multi-Hop</CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap mb-0">Laser Power (dBm)</Label>
                <Input
                  type="text" inputMode="decimal" className="w-24 h-9"
                  value={laser}
                  onChange={e => isValidSignedInput(e.target.value) && setLaser(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap mb-0 text-primary">Target (dBm)</Label>
                <Input
                  type="text" inputMode="decimal" className="w-24 h-9 border-primary/50"
                  value={targetPower}
                  onChange={e => isValidSignedInput(e.target.value) && setTargetPower(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Zap className="w-4 h-4 mr-2" /> Process
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-center">No</TableHead>
                  <TableHead>Connector (pcs)</TableHead>
                  <TableHead>Splicing (pcs)</TableHead>
                  <TableHead>P. Kabel (m)</TableHead>
                  <TableHead>ODP Type (Splitter Average)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    <TableCell className="text-center font-medium bg-muted/20 border-r">{index + 1}</TableCell>
                    <TableCell className="p-2">
                      <Input type="number" className="h-9" min="0" value={row.connector}
                        onChange={e => updateRow(index, "connector", e.target.value)} />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input type="number" className="h-9" min="0" value={row.splicing}
                        onChange={e => updateRow(index, "splicing", e.target.value)} />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input type="number" className="h-9" min="0" value={row.cable}
                        onChange={e => updateRow(index, "cable", e.target.value)} />
                    </TableCell>
                    <TableCell className="p-2">
                      <Select className="h-9" value={row.odpType}
                        onChange={e => updateRow(index, "odpType", e.target.value)}>
                        {Object.keys(SPLITTER_LOSS_MAP).map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </form>

      {results && (
        <Card className="shadow-xl border-primary/20 bg-background overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary to-red-400" />
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Hop Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-14 text-center">Hop</TableHead>
                  <TableHead>ODP Type (Splitter Average)</TableHead>
                  <TableHead className="text-right">Output ODP (dBm)</TableHead>
                  <TableHead className="text-right">Sisa Laser (dBm)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((res) => (
                  <TableRow key={res.no}>
                    <TableCell className="text-center font-bold text-muted-foreground">{res.no}</TableCell>
                    <TableCell className="font-mono font-bold text-lg">{res.ratio}</TableCell>
                    <TableCell className={cn("text-right font-mono font-bold text-lg", res.status === "GOOD SIGNAL" ? "text-green-600" : "text-destructive")}>
                      {res.output}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{res.sisaLaser}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={res.status === "GOOD SIGNAL" ? "success" : "destructive"}>
                        {res.status === "GOOD SIGNAL" ? "GOOD" : "LOW"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
