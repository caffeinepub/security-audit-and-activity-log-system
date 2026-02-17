import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Network, Server, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useBackendHealthCheck } from '../hooks/useBackendHealthCheck';
import { useIcpControls } from '../hooks/useIcpControls';

export default function IcpConnectionPanel() {
  const { isConnected, isChecking, error, refetch } = useBackendHealthCheck();
  const { config, networkLabel } = useIcpControls();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          ICP Connection Status
        </CardTitle>
        <CardDescription>
          Monitor your Internet Computer network connection and canister information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Network className="h-4 w-4" />
              Network
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${config.network === 'local' ? 'bg-blue-500' : 'bg-green-500'}`} />
              <span className="font-mono text-sm">{networkLabel}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Server className="h-4 w-4" />
              Connection Status
            </div>
            <div className="flex items-center gap-2">
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm">Checking...</span>
                </>
              ) : isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                    Connected
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">
                    Not Connected
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Server className="h-4 w-4" />
              Canister ID
            </div>
            <div className="font-mono text-xs break-all">{config.canisterId}</div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>Cannot reach the configured canister target.</p>
              <p className="text-sm">
                Current target: <span className="font-mono">{networkLabel}</span> / <span className="font-mono text-xs">{config.canisterId}</span>
              </p>
              <p className="text-sm">
                Use the <strong>ICP Controls</strong> panel below to verify or update your network and canister ID settings.
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isConnected && (
          <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-3">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Backend is responding normally
            </div>
            <Button onClick={() => refetch()} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
