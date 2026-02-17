import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, AlertTriangle, UserX, Radio } from 'lucide-react';
import type { T as AuditEntry } from '../backend';
import { format } from 'date-fns';
import { useGetFlaggedUsers } from '../hooks/useQueries';

interface RealTimeAlertPanelProps {
  logs: AuditEntry[];
}

export default function RealTimeAlertPanel({ logs }: RealTimeAlertPanelProps) {
  const { data: flaggedUsers } = useGetFlaggedUsers();
  const [newAlertCount, setNewAlertCount] = useState(0);

  const recentAlerts = useMemo(() => {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;

    const alerts = logs.filter(log => {
      const logTime = Number(log.timestamp / BigInt(1_000_000));
      return logTime >= last5Minutes && (log.severity === 'critical' || log.severity === 'warning');
    });

    return alerts.slice(0, 5);
  }, [logs]);

  useEffect(() => {
    setNewAlertCount(recentAlerts.length);
  }, [recentAlerts.length]);

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / BigInt(1_000_000)));
    return format(date, 'HH:mm:ss');
  };

  const formatPrincipal = (principal: any) => {
    const str = principal.toString();
    if (str.length > 20) {
      return `${str.slice(0, 10)}...${str.slice(-8)}`;
    }
    return str;
  };

  if (recentAlerts.length === 0 && (!flaggedUsers || flaggedUsers.length === 0)) {
    return null;
  }

  return (
    <Card className="border-orange-200 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/generated/realtime-alert.dim_64x64.png" alt="Real-time Alert" className="h-6 w-6" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Real-Time Security Alerts
                {newAlertCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {newAlertCount} New
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Live monitoring of critical security events</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Radio className="h-4 w-4 text-green-500 animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {flaggedUsers && flaggedUsers.length > 0 && (
          <Alert variant="destructive" className="border-red-300 dark:border-red-800">
            <UserX className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {flaggedUsers.length} user{flaggedUsers.length > 1 ? 's' : ''} currently flagged as suspicious
            </AlertDescription>
          </Alert>
        )}

        {recentAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Recent Alerts (Last 5 minutes)</h4>
            </div>
            {recentAlerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  alert.severity === 'critical'
                    ? 'border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/50'
                    : 'border-yellow-300 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-950/50'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {alert.severity === 'critical' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                    <Badge
                      variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.actionType}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{alert.details}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    User: {formatPrincipal(alert.user)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <img src="/assets/generated/broadcast-signal.dim_64x64.png" alt="Broadcast" className="h-3 w-3" />
          <span>
            Critical events and flagged users are automatically broadcast to configured external endpoints
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
