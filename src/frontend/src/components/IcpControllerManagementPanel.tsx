import { useState } from 'react';
import { useListIcpControllers, useGrantIcpControllerRole, useRevokeIcpControllerRole } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Server, UserPlus, UserMinus, AlertCircle, Shield } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

export default function IcpControllerManagementPanel() {
  const [principalInput, setPrincipalInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { data: icpControllers, isLoading } = useListIcpControllers();
  const grantRole = useGrantIcpControllerRole();
  const revokeRole = useRevokeIcpControllerRole();

  const validatePrincipal = (input: string): boolean => {
    if (!input.trim()) {
      setValidationError('Please enter a principal ID');
      return false;
    }

    try {
      Principal.fromText(input.trim());
      setValidationError(null);
      return true;
    } catch (error: any) {
      setValidationError(`Invalid principal ID: ${error.message}`);
      return false;
    }
  };

  const handleGrantRole = async () => {
    if (!validatePrincipal(principalInput)) {
      return;
    }

    try {
      await grantRole.mutateAsync(principalInput.trim());
      setPrincipalInput('');
      setValidationError(null);
    } catch (error: any) {
      // Error is already handled by the mutation's onError
    }
  };

  const handleRevokeRole = async (principal: Principal) => {
    try {
      await revokeRole.mutateAsync(principal.toString());
    } catch (error: any) {
      // Error is already handled by the mutation's onError
    }
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
          <Server className="h-5 w-5" />
          ICP Controller Management
        </CardTitle>
        <CardDescription>
          Grant or revoke ICP Controller role for managing canister controllers on the Internet Computer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            ICP Controllers can manage canister settings and controllers on the Internet Computer network. Only grant this role to trusted administrators.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="icpControllerInput">Grant ICP Controller Role</Label>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Input
                  id="icpControllerInput"
                  placeholder="Enter principal ID"
                  value={principalInput}
                  onChange={(e) => {
                    setPrincipalInput(e.target.value);
                    if (validationError) {
                      setValidationError(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGrantRole();
                    }
                  }}
                  className={validationError ? 'border-destructive' : ''}
                />
                {validationError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationError}
                  </p>
                )}
              </div>
              <div className="flex items-start">
                <Button 
                  onClick={handleGrantRole} 
                  disabled={grantRole.isPending || !principalInput.trim()}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Grant Role
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-purple-500" />
            Current ICP Controllers ({icpControllers?.length || 0})
          </h3>
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading ICP Controllers...</div>
          ) : icpControllers && icpControllers.length > 0 ? (
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
                  {icpControllers.map((principal, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{formatPrincipal(principal)}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="gap-1 bg-gradient-to-r from-purple-500 to-indigo-600">
                          <Server className="h-3 w-3" />
                          ICP Controller
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={revokeRole.isPending}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Revoke
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <UserMinus className="h-5 w-5 text-destructive" />
                                Revoke ICP Controller Role
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to revoke ICP Controller role from this principal? 
                                They will no longer be able to manage canister controllers on the Internet Computer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevokeRole(principal)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Revoke Role
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
              No ICP Controllers have been assigned yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
