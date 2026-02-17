import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Globe, Loader2, AlertCircle, Trash2, UserPlus } from 'lucide-react';
import { useListWorldWideWebControllers, useGrantWorldWideWebControllerRole, useRevokeWorldWideWebControllerRole } from '../hooks/useQueries';
import { Principal } from '@icp-sdk/core/principal';

export default function WorldWideWebControllerManagementPanel() {
  const [principalInput, setPrincipalInput] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data: controllers, isLoading: controllersLoading } = useListWorldWideWebControllers();
  const grantMutation = useGrantWorldWideWebControllerRole();
  const revokeMutation = useRevokeWorldWideWebControllerRole();

  const validatePrincipal = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError('Principal ID is required');
      return false;
    }
    try {
      Principal.fromText(value.trim());
      setValidationError('');
      return true;
    } catch (error) {
      setValidationError('Invalid Principal ID format');
      return false;
    }
  };

  const handleGrant = async () => {
    if (!validatePrincipal(principalInput)) return;

    try {
      await grantMutation.mutateAsync(principalInput.trim());
      setPrincipalInput('');
      setValidationError('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRevoke = async (principal: string) => {
    if (window.confirm(`Are you sure you want to revoke World Wide Web Controller role from ${principal}?`)) {
      try {
        await revokeMutation.mutateAsync(principal);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          World Wide Web Controller Management
        </CardTitle>
        <CardDescription>
          Grant World Wide Web Controller role to any principal, including yourself
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grant Role Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="www-principal">Principal ID</Label>
            <div className="flex gap-2">
              <Input
                id="www-principal"
                placeholder="Enter principal ID"
                value={principalInput}
                onChange={(e) => {
                  setPrincipalInput(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className={validationError ? 'border-destructive' : ''}
              />
              <Button
                onClick={handleGrant}
                disabled={grantMutation.isPending || !principalInput.trim()}
              >
                {grantMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Grant Role
                  </>
                )}
              </Button>
            </div>
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              World Wide Web Controller role grants access to ICP Operations Console with web-specific controls. 
              This role does not provide access to Security Dashboard features.
            </AlertDescription>
          </Alert>
        </div>

        {/* Controllers List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Assigned Controllers</h3>
            {controllers && controllers.length > 0 && (
              <Badge variant="secondary">{controllers.length} total</Badge>
            )}
          </div>

          {controllersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !controllers || controllers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Globe className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No World Wide Web Controllers assigned yet
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controllers.map((controller) => (
                    <TableRow key={controller.toString()}>
                      <TableCell className="font-mono text-xs">
                        {controller.toString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(controller.toString())}
                          disabled={revokeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
