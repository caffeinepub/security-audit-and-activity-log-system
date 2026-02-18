import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAppControllerPrincipal, useInitializeAppController, useTransferAppController, useGetCallerAppControllerStatus, useGetCallerSecurityStatus } from '../hooks/useQueries';
import { Copy, Shield, AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import InlineLoadingState from './InlineLoadingState';
import { Principal } from '@icp-sdk/core/principal';

export default function RolesAccessPanel() {
  const { identity } = useInternetIdentity();
  const { data: appControllerPrincipal, isLoading: principalLoading, error: principalError } = useGetAppControllerPrincipal();
  const { data: isAppController, isLoading: appControllerStatusLoading } = useGetCallerAppControllerStatus();
  const { data: isSecurity, isLoading: securityStatusLoading } = useGetCallerSecurityStatus();
  const initializeMutation = useInitializeAppController();
  const transferMutation = useTransferAppController();

  const [targetPrincipalInput, setTargetPrincipalInput] = useState('');

  const callerPrincipal = identity?.getPrincipal().toString();
  const isAuthenticated = !!identity;

  const handleCopyPrincipal = (principal: string) => {
    navigator.clipboard.writeText(principal);
    toast.success('Principal copied to clipboard');
  };

  const handleClaimAppController = async () => {
    try {
      await initializeMutation.mutateAsync();
    } catch (error: any) {
      // Error handling is done in the mutation
      console.error('Failed to claim App Controller:', error);
    }
  };

  const handleTransferToSelf = async () => {
    if (!callerPrincipal) return;
    try {
      await transferMutation.mutateAsync(callerPrincipal);
    } catch (error: any) {
      console.error('Failed to transfer App Controller to self:', error);
    }
  };

  const handleTransferToTarget = async () => {
    if (!targetPrincipalInput.trim()) {
      toast.error('Please enter a valid Principal ID');
      return;
    }

    // Validate principal format
    try {
      Principal.fromText(targetPrincipalInput.trim());
    } catch (error) {
      toast.error('Invalid Principal ID format');
      return;
    }

    try {
      await transferMutation.mutateAsync(targetPrincipalInput.trim());
      setTargetPrincipalInput('');
    } catch (error: any) {
      console.error('Failed to transfer App Controller:', error);
    }
  };

  // Show error state if actor is not available
  if (principalError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Access
          </CardTitle>
          <CardDescription>Role information and access control</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load role information. Backend connection is not available.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isInitialized = appControllerPrincipal !== null && appControllerPrincipal !== undefined;
  const showClaimButton = isAuthenticated && !isInitialized && !principalLoading;
  
  // Show transfer controls if user is App Controller or Security
  const canTransfer = isAuthenticated && isInitialized && (isAppController || isSecurity) && !appControllerStatusLoading && !securityStatusLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Roles & Access
        </CardTitle>
        <CardDescription>Role information and access control</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Caller Principal */}
        {isAuthenticated && callerPrincipal && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Principal</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyPrincipal(callerPrincipal)}
                className="h-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-md bg-muted p-3">
              <code className="text-xs break-all">{callerPrincipal}</code>
            </div>
          </div>
        )}

        {/* App Controller Principal */}
        <div className="space-y-2">
          <span className="text-sm font-medium">App Controller Principal</span>
          {principalLoading ? (
            <div className="rounded-md bg-muted p-3">
              <InlineLoadingState message="Loading principal..." />
            </div>
          ) : isInitialized && appControllerPrincipal ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="rounded-md bg-muted p-3 flex-1">
                  <code className="text-xs break-all">{appControllerPrincipal.toString()}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyPrincipal(appControllerPrincipal.toString())}
                  className="h-8 ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-muted p-3">
              <span className="text-xs text-muted-foreground">Not initialized</span>
            </div>
          )}
        </div>

        {/* Claim App Controller Button */}
        {showClaimButton && (
          <div className="pt-2">
            <Button
              onClick={handleClaimAppController}
              disabled={initializeMutation.isPending}
              className="w-full"
            >
              {initializeMutation.isPending ? (
                <>
                  <Info className="mr-2 h-4 w-4" />
                  Claiming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Claim App Controller
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Initialize the system and become the App Controller. This action can only be performed once.
            </p>
          </div>
        )}

        {/* App Controller Transfer Section */}
        {canTransfer && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">App Controller Transfer</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Transfer the App Controller role to another principal. This action is logged in the audit trail.
                </p>
              </div>

              {/* Transfer to Self */}
              <div className="space-y-2">
                <Button
                  onClick={handleTransferToSelf}
                  disabled={transferMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {transferMutation.isPending ? (
                    <>
                      <Info className="mr-2 h-4 w-4" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Make me App Controller
                    </>
                  )}
                </Button>
              </div>

              {/* Transfer to Another Principal */}
              <div className="space-y-2">
                <Label htmlFor="targetPrincipal" className="text-xs">
                  Transfer to Principal
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="targetPrincipal"
                    placeholder="Enter Principal ID"
                    value={targetPrincipalInput}
                    onChange={(e) => setTargetPrincipalInput(e.target.value)}
                    disabled={transferMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTransferToTarget}
                    disabled={transferMutation.isPending || !targetPrincipalInput.trim()}
                    size="icon"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Authorization Message for Non-Authorized Users */}
        {isAuthenticated && isInitialized && !canTransfer && !appControllerStatusLoading && !securityStatusLoading && (
          <>
            <Separator className="my-4" />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Only the App Controller or Security users can transfer the App Controller role.
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Supported Roles Information */}
        <div className="pt-4 border-t space-y-3">
          <div className="text-sm font-medium">Supported Roles</div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="default" className="mt-0.5">App Controller</Badge>
              <span className="text-xs text-muted-foreground">
                Full system access, can manage all roles and settings
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">Security</Badge>
              <span className="text-xs text-muted-foreground">
                Access to security features, audit logs, and user management
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">ICP Controller</Badge>
              <span className="text-xs text-muted-foreground">
                Access to ICP operations and configuration management
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">World Wide Web Controller</Badge>
              <span className="text-xs text-muted-foreground">
                Access to ICP operations with web-specific controls (alias: Web control)
              </span>
            </div>
          </div>

          {/* Request Access Guidance */}
          {isAuthenticated && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs space-y-2">
                <p className="font-medium">Need Access?</p>
                <p>
                  Share your Principal ID (shown above) with the App Controller to request:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Security role</strong> for security and audit features</li>
                  <li><strong>ICP Controller role</strong> for ICP operations</li>
                  <li><strong>World Wide Web Controller role</strong> for web-specific ICP operations</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
