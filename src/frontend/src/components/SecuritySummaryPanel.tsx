import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ShieldAlert, UserX, TrendingUp, Activity } from 'lucide-react';
import type { T as AuditEntry } from '../backend';
import { format } from 'date-fns';

interface SecuritySummaryPanelProps {
  logs: AuditEntry[];
}

export default function SecuritySummaryPanel({ logs }: SecuritySummaryPanelProps) {
  const summary = useMemo(() => {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const last7Days = now - 7 * 24 * 60 * 60 * 1000;

    const recentLogs = logs.filter(log => {
      const logTime = Number(log.timestamp / BigInt(1_000_000));
      return logTime >= last24Hours;
    });

    const weekLogs = logs.filter(log => {
      const logTime = Number(log.timestamp / BigInt(1_000_000));
      return logTime >= last7Days;
    });

    const criticalEvents = recentLogs.filter(log => log.severity === 'critical');
    const failedLogins = recentLogs.filter(log => log.actionType === 'loginAttempt' && log.success === false);
    const unauthorizedAttempts = recentLogs.filter(log => log.actionType === 'unauthorizedAttempt');
    const accountDeletions = recentLogs.filter(log => log.actionType === 'accountChange' && log.details.toLowerCase().includes('delete'));

    // Detect failed login spikes (more than 5 failed logins in 24 hours)
    const hasFailedLoginSpike = failedLogins.length > 5;

    // Get most recent critical events
    const recentCritical = criticalEvents.slice(0, 5);

    return {
      criticalCount: criticalEvents.length,
      failedLoginCount: failedLogins.length,
      unauthorizedCount: unauthorizedAttempts.length,
      accountDeletionCount: accountDeletions.length,
      hasFailedLoginSpike,
      recentCritical,
      totalEvents24h: recentLogs.length,
      totalEvents7d: weekLogs.length,
    };
  }, [logs]);

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / BigInt(1_000_000)));
    return format(date, 'MMM dd, HH:mm');
  };

  const formatPrincipal = (principal: any) => {
    const str = principal.toString();
    if (str.length > 20) {
      return `${str.slice(0, 10)}...${str.slice(-8)}`;
    }
    return str;
  };

  return (
    <div className="space-y-4">
      {summary.hasFailedLoginSpike && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Security Alert: Detected {summary.failedLoginCount} failed login attempts in the last 24 hours. This may indicate a brute force attack.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Security Summary
          </CardTitle>
          <CardDescription>Recent critical security events and activity overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Critical Events</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold">{summary.criticalCount}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed Logins</span>
                <ShieldAlert className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{summary.failedLoginCount}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unauthorized Access</span>
                <ShieldAlert className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{summary.unauthorizedCount}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Deletions</span>
                <UserX className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{summary.accountDeletionCount}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Recent Critical Events</h4>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {summary.totalEvents24h} events (24h)
              </Badge>
            </div>

            {summary.recentCritical.length > 0 ? (
              <div className="space-y-2">
                {summary.recentCritical.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {event.actionType}
                        </Badge>
                      </div>
                      <p className="text-sm truncate">{event.details}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        User: {formatPrincipal(event.user)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No critical events in the last 24 hours
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
