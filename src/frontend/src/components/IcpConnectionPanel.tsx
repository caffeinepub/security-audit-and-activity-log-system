import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Network, Server, RefreshCw, CheckCircle2, XCircle, Info } from 'lucide-react';
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
                  <Info className="h-4 w-4 text-blue-500" />
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
                    Disconnected
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
            <div className="font-mono text-xs break-all">
              {config.canisterId}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">Connection Error</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs text-muted-foreground">
                If this persists, check your ICP Controls settings to ensure the network and canister ID are configured correctly.
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Successfully connected to {networkLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
