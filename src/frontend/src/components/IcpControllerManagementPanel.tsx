import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useListIcpControllers, useGrantIcpControllerRole, useRevokeIcpControllerRole } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, UserPlus, UserMinus, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function IcpControllerManagementPanel() {
  const [principalInput, setPrincipalInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const { identity } = useInternetIdentity();
  const { data: controllers, isLoading } = useListIcpControllers(false);
  const grantMutation = useGrantIcpControllerRole();
  const revokeMutation = useRevokeIcpControllerRole();

  const isAuthenticated = !!identity;
  const callerPrincipal = identity?.getPrincipal().toString();

  const handleGrantRole = async () => {
    if (!principalInput.trim()) return;

    try {
      await grantMutation.mutateAsync({
        target: principalInput.trim(),
        name: nameInput.trim() || null,
        description: descriptionInput.trim() || null,
      });
      setPrincipalInput('');
      setNameInput('');
      setDescriptionInput('');
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleRevokeRole = async () => {
    if (!revokeTarget) return;

    try {
      await revokeMutation.mutateAsync(revokeTarget);
      setRevokeTarget(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleFillMyPrincipal = () => {
    if (callerPrincipal) {
      setPrincipalInput(callerPrincipal);
    }
  };

  const handleGrantToMe = async () => {
    if (!callerPrincipal) return;

    try {
      await grantMutation.mutateAsync({
        target: callerPrincipal,
        name: nameInput.trim() || null,
        description: descriptionInput.trim() || null,
      });
      setNameInput('');
      setDescriptionInput('');
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const isPrincipalValid = (principal: string): boolean => {
    try {
      return principal.trim().length > 0;
    } catch {
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          ICP Controller Management
        </CardTitle>
        <CardDescription>
          Grant and revoke ICP Controller role for operational access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>App Controller only:</strong> ICP Controllers have access to ICP operations and configuration management.
          </AlertDescription>
        </Alert>

        {/* Grant Role Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Grant ICP Controller Role
          </h3>

          {isAuthenticated && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFillMyPrincipal}
                disabled={grantMutation.isPending}
              >
                Fill My Principal
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleGrantToMe}
                disabled={grantMutation.isPending || !callerPrincipal}
              >
                {grantMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Grant ICP Controller to Me
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="principalInput">Principal ID *</Label>
            <Input
              id="principalInput"
              placeholder="Enter principal ID"
              value={principalInput}
              onChange={(e) => setPrincipalInput(e.target.value)}
              disabled={grantMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameInput">Name (optional)</Label>
            <Input
              id="nameInput"
              placeholder="Enter name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={grantMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionInput">Description (optional)</Label>
            <Textarea
              id="descriptionInput"
              placeholder="Enter description"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              disabled={grantMutation.isPending}
              rows={3}
            />
          </div>

          <Button
            onClick={handleGrantRole}
            disabled={!isPrincipalValid(principalInput) || grantMutation.isPending}
            className="w-full"
          >
            {grantMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Granting Role...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Grant Role
              </>
            )}
          </Button>
        </div>

        {/* Current ICP Controllers List */}
        <div className="space-y-4">
          <h3 className="font-semibold">Current ICP Controllers</h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : controllers && controllers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controllers.map((controller) => (
                    <TableRow key={controller.principal.toString()}>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {controller.principal.toString()}
                      </TableCell>
                      <TableCell>
                        {controller.name ? (
                          <span className="text-sm">{controller.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {controller.description ? (
                          <span className="text-sm">{controller.description}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(Number(controller.assignedTimestamp) / 1_000_000, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(controller.principal.toString())}
                          disabled={revokeMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No ICP Controllers have been assigned yet.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke ICP Controller Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the ICP Controller role from this principal?
              <br />
              <br />
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {revokeTarget}
              </code>
              <br />
              This action will remove their access to ICP operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
