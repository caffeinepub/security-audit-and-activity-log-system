import { useState } from 'react';
import { useGetFlaggedUsers, useFlagUser, useUnflagUser, useRemoveUser } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Flag, Trash2, AlertTriangle, UserX } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

export default function UserManagementPanel() {
  const [principalInput, setPrincipalInput] = useState('');
  const { data: flaggedUsers, isLoading } = useGetFlaggedUsers();
  const flagUser = useFlagUser();
  const unflagUser = useUnflagUser();
  const removeUser = useRemoveUser();

  const handleFlagUser = async () => {
    if (!principalInput.trim()) {
      toast.error('Please enter a valid principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(principalInput.trim());
      await flagUser.mutateAsync(principal.toString());
      setPrincipalInput('');
    } catch (error: any) {
      toast.error(`Invalid principal ID: ${error.message}`);
    }
  };

  const handleUnflagUser = async (principal: Principal) => {
    await unflagUser.mutateAsync(principal.toString());
  };

  const handleRemoveUser = async (principal: Principal) => {
    await removeUser.mutateAsync(principal.toString());
  };

  const formatPrincipal = (principal: Principal) => {
    const str = principal.toString();
    if (str.length > 30) {
      return `${str.slice(0, 15)}...${str.slice(-12)}`;
    }
    return str;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>Flag suspicious users and manage access control</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="principalInput">Flag User by Principal ID</Label>
            <Input
              id="principalInput"
              placeholder="Enter principal ID to flag"
              value={principalInput}
              onChange={(e) => setPrincipalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFlagUser();
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleFlagUser} disabled={flagUser.isPending || !principalInput.trim()}>
              <Flag className="mr-2 h-4 w-4" />
              Flag User
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Flagged Users ({flaggedUsers?.length || 0})
          </h3>
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading flagged users...</div>
          ) : flaggedUsers && flaggedUsers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedUsers.map((principal, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{formatPrincipal(principal)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="gap-1">
                          <Flag className="h-3 w-3" />
                          Flagged
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          onClick={() => handleUnflagUser(principal)}
                          variant="outline"
                          size="sm"
                          disabled={unflagUser.isPending}
                        >
                          Unflag
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={removeUser.isPending}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <UserX className="h-5 w-5 text-destructive" />
                                Remove User
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently remove this user? This action will delete their
                                profile and all associated data. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveUser(principal)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground border rounded-md bg-muted/20">
              No users have been flagged yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
