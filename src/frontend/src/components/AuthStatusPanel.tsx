import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, CheckCircle2, XCircle, RefreshCw, Copy } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useBackendHealthCheck } from '../hooks/useBackendHealthCheck';
import { toast } from 'sonner';

export default function AuthStatusPanel() {
  const { identity, loginStatus } = useInternetIdentity();
  const { isConnected, error, refetch } = useBackendHealthCheck();

  const principal = identity?.getPrincipal().toString() || '';
  const isAuthenticated = !!identity;

  const formatPrincipal = (p: string) => {
    if (p.length > 30) {
      return `${p.slice(0, 15)}...${p.slice(-12)}`;
    }
    return p;
  };

  const copyPrincipal = () => {
    navigator.clipboard.writeText(principal);
    toast.success('Principal ID copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          View your current authentication state and principal identity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Login Status
            </div>
            <div className="flex items-center gap-2">
              {loginStatus === 'logging-in' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm">Logging in...</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                    Authenticated
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <Badge variant="outline" className="border-gray-500 text-gray-700 dark:text-gray-400">
                    Not Authenticated
                  </Badge>
                </>
              )}
            </div>
          </div>

          {isAuthenticated && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Principal ID
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs break-all">{formatPrincipal(principal)}</span>
                <Button onClick={copyPrincipal} variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && !isConnected && error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Backend Connection Issue</p>
                <p className="text-sm">
                  You are logged in, but the backend is not responding. This may be a temporary network issue or the canister may be unavailable.
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="ml-4 shrink-0">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && isConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Successfully authenticated and connected to backend
          </div>
        )}
      </CardContent>
    </Card>
  );
}
