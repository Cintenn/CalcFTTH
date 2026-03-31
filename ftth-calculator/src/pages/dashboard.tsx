import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { Info, Cable, Network, ListTree } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div 
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7f1d1d, #b91c1c, #dc2626)",
          borderRadius: "18px",
          padding: "28px 32px",
          boxShadow: "0 0 0 1px rgba(220,38,38,0.15), 0 12px 30px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-display mb-4" style={{ color: "#ffffff", fontWeight: 700 }}>FTTH Optical Loss Calculation Tool</h1>
          <p className="text-lg" style={{ color: "#d1d5db", lineHeight: 1.6 }}>
            Welcome to the engineering dashboard. This tool helps you accurately calculate optical power budgets for Fiber To The Home networks. 
            Use the navigation menu to access various calculation modules. Below are the standard reference tables used in calculations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-1 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cable className="text-primary w-5 h-5" /> Accessories Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Loss (dB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Adapter", loss: "0.30" },
                  { name: "Pigtail", loss: "0.30" },
                  { name: "Patchcore", loss: "0.30" },
                  { name: "Fast Connector", loss: "0.30" },
                  { name: "Point Splicing", loss: "0.10" },
                ].map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right text-primary font-mono">{item.loss}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-1 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Network className="text-primary w-5 h-5" /> Splitter Average Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Splitter Type</TableHead>
                  <TableHead className="text-right">Max Loss (dB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "1 : 2", loss: "3.20" },
                  { name: "1 : 4", loss: "7.20" },
                  { name: "1 : 8", loss: "10.30" },
                  { name: "1 : 16", loss: "13.30" },
                  { name: "1 : 32", loss: "16.60" },
                ].map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium font-mono">{item.name}</TableCell>
                    <TableCell className="text-right text-primary font-mono">{item.loss}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-1 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListTree className="text-primary w-5 h-5" /> Optical Ratio (FBT)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Ratio</TableHead>
                    <TableHead className="text-right">Loss (dBm)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "1 : 99", loss: "-20.20" },
                    { name: "2 : 98", loss: "-17.19" },
                    { name: "3 : 97", loss: "-15.43" },
                    { name: "5 : 95", loss: "-13.21" },
                    { name: "10 : 90", loss: "-10.20" },
                    { name: "20 : 80", loss: "-7.19" },
                    { name: "30 : 70", loss: "-5.43" },
                    { name: "40 : 60", loss: "-4.18" },
                    { name: "45 : 55", loss: "-3.67" },
                    { name: "50 : 50", loss: "-3.21" },
                  ].map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium font-mono">{item.name}</TableCell>
                      <TableCell className="text-right text-primary font-mono">{item.loss}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-red-50 text-red-900 border border-red-200 p-4 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
        <div className="text-sm">
          <strong>Threshold Standard:</strong> System evaluates output power based on -28 dBm threshold. Outputs <code className="bg-white px-1 py-0.5 rounded text-red-600 font-bold">&gt;= -28 dBm</code> are marked <span className="text-green-600 font-bold">GOOD</span>, otherwise <span className="text-red-600 font-bold">BAD</span>.
        </div>
      </div>
    </div>
  );
}
