import React from "react";
import { useGetProjects, useDeleteProject } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button, Badge } from "@/components/ui";
import { format } from "date-fns";
import { Trash2, Download, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function History() {
  const { data, isLoading } = useGetProjects();
  const deleteMutation = useDeleteProject();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    if (confirm("Delete this saved calculation?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        }
      });
    }
  };

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="bg-muted/30 flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Calculation History</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Your saved power budget calculations.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2"/> CSV</Button>
           <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-2"/> PDF</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Loading history...</TableCell></TableRow>
            ) : data?.projects?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No saved projects found.</TableCell></TableRow>
            ) : (
              data?.projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">
                     {format(new Date(p.createdAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-semibold">{p.projectName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase font-mono text-[10px] tracking-wider">{p.calculationType}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
