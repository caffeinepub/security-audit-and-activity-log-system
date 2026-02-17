import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConfigureExternalBroadcasting, useGetExternalBroadcastingSettings } from '../hooks/useQueries';
import { Radio, Save, Info, Loader2 } from 'lucide-react';

export default function BroadcastConfigPanel() {
  const [enabled, setEnabled] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState('');
  const configMutation = useConfigureExternalBroadcasting();
  const { data: settings, isLoading } = useGetExternalBroadcastingSettings();

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setEndpointUrl(settings.endpointUrl ?? '');
    }
  }, [settings]);

  const handleSave = () => {
    configMutation.mutate({
      enabled,
      endpointUrl: enabled && endpointUrl.trim() ? endpointUrl.trim() : null,
    });
  };

  const isValid = !enabled || (enabled && endpointUrl.trim().length > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <img src="/assets/generated/broadcast-signal.dim_64x64.png" alt="Broadcast" className="h-6 w-6" />
            <div>
              <CardTitle>External Broadcasting Configuration</CardTitle>
              <CardDescription>Configure external endpoint for security event notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <img src="/assets/generated/broadcast-signal.dim_64x64.png" alt="Broadcast" className="h-6 w-6" />
          <div>
            <CardTitle>External Broadcasting Configuration</CardTitle>
            <CardDescription>Configure external endpoint for security event notifications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            When enabled, critical security events and flagged user notifications will be sent to the configured external endpoint via HTTP POST requests.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="broadcast-enabled" className="text-base font-medium flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Enable External Broadcasting
            </Label>
            <p className="text-sm text-muted-foreground">
              Send security alerts to external monitoring systems
            </p>
          </div>
          <Switch
            id="broadcast-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="endpoint-url" className="flex items-center gap-2">
              <img src="/assets/generated/external-config.dim_64x64.png" alt="Config" className="h-4 w-4" />
              External Endpoint URL
            </Label>
            <Input
              id="endpoint-url"
              type="url"
              placeholder="https://api.example.com/security-alerts"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter the full URL where security event notifications should be sent
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!isValid || configMutation.isPending}
            className="gap-2"
          >
            {configMutation.isPending ? (
              <>
                <Radio className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
          {!isValid && (
            <p className="text-sm text-destructive">
              Please enter a valid endpoint URL when broadcasting is enabled
            </p>
          )}
        </div>

        <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <img src="/assets/generated/notification-bell.dim_64x64.png" alt="Notification" className="h-4 w-4" />
            Broadcast Events
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Critical security events (severity: critical)</li>
            <li>User flagged notifications (severity: warning)</li>
            <li>User account removal events (severity: warning)</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            Broadcast messages include event type, timestamp, user principal, details, and severity. Sensitive session data is anonymized.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
