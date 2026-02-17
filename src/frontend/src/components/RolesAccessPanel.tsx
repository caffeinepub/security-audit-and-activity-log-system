import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAppControllerPrincipal, useInitializeAppController } from '../hooks/useQueries';
import { Copy, Shield, AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RolesAccessPanel() {
  const { identity } = useInternetIdentity();
  const { data: appControllerPrincipal, isLoading: principalLoading, error: principalError } = useGetAppControllerPrincipal();
  const initializeMutation = useInitializeAppController();

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
            <div className="rounded-md bg-muted p-3 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  The App Controller cannot be changed from the UI once initialized.
                </AlertDescription>
              </Alert>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          </div>
          
          {/* Unsupported Role Warning */}
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-2">
              <p className="font-medium">
                "Web control" / "World Wide Web Controller" is not a supported role in this application.
              </p>
              <p>
                Only the three roles listed above (App Controller, Security, ICP Controller) are available.
              </p>
            </AlertDescription>
          </Alert>

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
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
