import React, { useState } from "react";
import { useGetUsers, useCreateUser, useDeleteUser, useResetUserDevice } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button, Badge, Input, Label, Select } from "@/components/ui";
import { Shield, Trash2, Smartphone, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminUsers() {
  const { data, isLoading } = useGetUsers();
  const deleteMutation = useDeleteUser();
  const resetMutation = useResetUserDevice();
  const createMutation = useCreateUser();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"super_admin"|"user">("user");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/users"] });

  const handleDelete = (id: number) => {
    if (confirm("Permanently delete this user?")) {
      deleteMutation.mutate({ id }, { onSuccess: invalidate });
    }
  };

  const handleResetDevice = (id: number) => {
    if (confirm("Reset device binding? User will need to login again from their new device.")) {
      resetMutation.mutate({ id }, { onSuccess: invalidate });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: { username: newUsername, password: newPassword, role: newRole }
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setNewUsername("");
        setNewPassword("");
        invalidate();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold font-display">User Management</h2>
            <p className="text-muted-foreground">Manage engineers and administrators.</p>
         </div>
         <Button onClick={() => setIsCreating(!isCreating)} className={isCreating ? "bg-muted text-foreground hover:bg-muted/80" : ""}>
            {isCreating ? "Cancel" : <><Plus className="w-4 h-4 mr-2"/> Add User</>}
         </Button>
      </div>

      {isCreating && (
        <Card className="border-primary shadow-lg animate-slide-up">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="text-base text-primary">Create New Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
             <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                   <Label>Username</Label>
                   <Input required value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                   <Label>Password</Label>
                   <Input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5 w-48">
                   <Label>Role</Label>
                   <Select value={newRole} onChange={e => setNewRole(e.target.value as any)}>
                      <option value="user">Engineer</option>
                      <option value="super_admin">Super Admin</option>
                   </Select>
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="w-32">
                   Save User
                </Button>
             </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Security Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading users...</TableCell></TableRow>
              ) : (
                data?.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold flex items-center gap-2">
                       {u.role === 'super_admin' && <Shield className="w-4 h-4 text-primary" />}
                       {u.username}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'super_admin' ? 'default' : 'secondary'} className="uppercase font-mono text-[10px]">
                         {u.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.createdAt ? format(new Date(u.createdAt), "MMM dd, yyyy") : '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" title="Reset Device Binding" onClick={() => handleResetDevice(u.id)}>
                        <Smartphone className="w-4 h-4 mr-2" /> Reset Device
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id)}>
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
    </div>
  );
}
