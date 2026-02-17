import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Calendar, User, Activity, Globe, Smartphone, Database, AlertTriangle } from 'lucide-react';
import type { T as AuditEntry, T__1 as ActionType, T__2 as EventSeverity } from '../backend';

interface AuditLogDetailDialogProps {
  log: AuditEntry;
  onClose: () => void;
}

export default function AuditLogDetailDialog({ log, onClose }: AuditLogDetailDialogProps) {
  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / BigInt(1_000_000)));
    return format(date, 'MMMM dd, yyyy HH:mm:ss');
  };

  const getActionTypeLabel = (type: ActionType) => {
    const labels: Record<string, string> = {
      loginAttempt: 'Login Attempt',
      permissionChange: 'Permission Change',
      dataExport: 'Data Export',
      dataImport: 'Data Import',
      accountChange: 'Account Change',
      unauthorizedAttempt: 'Unauthorized Access Attempt',
      configUpload: 'Configuration File Upload',
      general: 'General Activity',
    };
    return labels[type] || type;
  };

  const getSeverityConfig = (sev: EventSeverity) => {
    const configs: Record<string, { color: string; label: string; icon: string }> = {
      info: { color: 'text-green-600 dark:text-green-400', label: 'Info', icon: '/assets/generated/security-shield-check.dim_64x64.png' },
      warning: { color: 'text-yellow-600 dark:text-yellow-400', label: 'Warning', icon: '/assets/generated/warning-triangle.dim_64x64.png' },
      critical: { color: 'text-red-600 dark:text-red-400', label: 'Critical', icon: '/assets/generated/critical-alert.dim_64x64.png' },
    };
    return configs[sev] || configs.info;
  };

  const getActionDescription = (type: ActionType) => {
    const descriptions: Record<string, string> = {
      loginAttempt: 'A user attempted to authenticate with the system. This includes both successful and failed login attempts.',
      permissionChange: 'User roles or permissions were modified. This includes granting or revoking admin privileges.',
      dataExport: 'Data was exported from the system. This may include sensitive information being downloaded or transferred.',
      dataImport: 'Data was imported into the system. This may include bulk uploads or data migration activities.',
      accountChange: 'User account was created, modified, or deleted. This includes profile updates and account management actions.',
      unauthorizedAttempt: 'An unauthorized access attempt was detected and blocked. This indicates a potential security threat.',
      configUpload: 'Configuration files or sensitive settings were uploaded or modified. This may affect system behavior.',
      general: 'General system activity that does not fall into other specific categories.',
    };
    return descriptions[type] || 'System activity recorded for audit purposes.';
  };

  const severityConfig = getSeverityConfig(log.severity);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Log Details
          </DialogTitle>
          <DialogDescription>Complete information about this security audit entry</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4">
            <div className="grid gap-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Timestamp
                  </div>
                  <p className="font-mono text-sm">{formatTimestamp(log.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {getActionTypeLabel(log.actionType)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <img src={severityConfig.icon} alt={severityConfig.label} className="h-5 w-5" />
                    <span className={`text-sm font-semibold ${severityConfig.color}`}>
                      {severityConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium mb-1">Event Description</p>
                    <p className="text-sm text-muted-foreground">{getActionDescription(log.actionType)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  User Principal
                </div>
                <p className="font-mono text-sm break-all">{log.user.toString()}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  Details
                </div>
                <p className="text-sm">{log.details}</p>
              </div>

              {log.ipAddress && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      IP Address
                    </div>
                    <p className="font-mono text-sm">{log.ipAddress}</p>
                  </div>
                </>
              )}

              {log.deviceInfo && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Smartphone className="h-4 w-4" />
                      Device Information
                    </div>
                    <p className="text-sm">{log.deviceInfo}</p>
                  </div>
                </>
              )}

              {log.sessionData && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Database className="h-4 w-4" />
                      Session Data
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <pre className="text-xs whitespace-pre-wrap break-all">{log.sessionData}</pre>
                    </div>
                  </div>
                </>
              )}

              {log.success !== undefined && log.success !== null && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Status
                    </div>
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Failed</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
