import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Shield, Loader2, CheckCircle2, AlertTriangle, FileText, Users, Database } from 'lucide-react';
import { useExportAuditLogToJson, useRecordAuditEntry, useGetFlaggedUsers } from '../hooks/useQueries';
import type { T as AuditEntry } from '../backend';
import { T__1, T__2 } from '../backend';
import { toast } from 'sonner';

interface SuperuserAuditPanelProps {
  currentLogs: AuditEntry[];
}

export default function SuperuserAuditPanel({ currentLogs }: SuperuserAuditPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const exportAuditLog = useExportAuditLogToJson();
  const recordAuditEntry = useRecordAuditEntry();
  const { data: flaggedUsers } = useGetFlaggedUsers();

  const downloadJson = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCurrent = async () => {
    if (currentLogs.length === 0) {
      toast.error('No logs to export in current view');
      return;
    }

    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit-logs-filtered-${timestamp}.json`;
      downloadJson(currentLogs, filename);
      
      await recordAuditEntry.mutateAsync({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        user: '' as any,
        actionType: T__1.dataExport,
        details: `Superuser export performed: ${currentLogs.length} filtered log entries exported`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: true,
        severity: T__2.info,
      });

      toast.success(`Exported ${currentLogs.length} log entries`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
      await recordAuditEntry.mutateAsync({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        user: '' as any,
        actionType: T__1.dataExport,
        details: `Superuser export failed: ${error.message}`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: false,
        severity: T__2.warning,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const allLogs = await exportAuditLog.mutateAsync();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit-logs-complete-${timestamp}.json`;
      downloadJson(allLogs, filename);
      toast.success(`Exported ${allLogs.length} total log entries`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFlaggedUsers = async () => {
    if (!flaggedUsers || flaggedUsers.length === 0) {
      toast.error('No flagged users to export');
      return;
    }

    setIsProcessing(true);
    try {
      const flaggedData = flaggedUsers.map(principal => ({
        principal: principal.toString(),
        flaggedAt: new Date().toISOString(),
      }));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `flagged-users-${timestamp}.json`;
      downloadJson(flaggedData, filename);

      await recordAuditEntry.mutateAsync({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        user: '' as any,
        actionType: T__1.dataExport,
        details: `Superuser action: Exported ${flaggedUsers.length} flagged user(s)`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: true,
        severity: T__2.info,
      });

      toast.success(`Exported ${flaggedUsers.length} flagged user(s)`);
    } catch (error: any) {
      toast.error(`Failed to export flagged users: ${error.message}`);
      await recordAuditEntry.mutateAsync({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        user: '' as any,
        actionType: T__1.dataExport,
        details: `Superuser action failed: Export flagged users - ${error.message}`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: false,
        severity: T__2.warning,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordAdminNote = async () => {
    setIsProcessing(true);
    try {
      await recordAuditEntry.mutateAsync({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        user: '' as any,
        actionType: T__1.general,
        details: 'Superuser administrative note: Manual audit checkpoint recorded',
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: true,
        severity: T__2.info,
      });

      toast.success('Administrative note recorded in audit log');
    } catch (error: any) {
      toast.error(`Failed to record note: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAuditSummary = async () => {
    setIsProcessing(true);
    try {
      const summary = {
        totalLogs: currentLogs.length,
        criticalEvents: currentLogs.filter(log => log.severity === 'critical').length,
        warningEvents: currentLogs.filter(log => log.severity === 'warning').length,
        infoEvents: currentLogs.filter(log => log.severity === 'info').length,
        flaggedUsersCount: flaggedUsers?.length || 0,
        generatedAt: new Date().toISOString(),
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit-summary-${timestamp}.json`;
      downloadJson(summary, filename);

      await recordAuditEntry.mutateAsync({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        user: '' as any,
        actionType: T__1.dataExport,
        details: `Superuser action: Generated audit summary report (${summary.totalLogs} logs analyzed)`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: true,
        severity: T__2.info,
      });

      toast.success('Audit summary generated successfully');
    } catch (error: any) {
      toast.error(`Failed to generate summary: ${error.message}`);
      await recordAuditEntry.mutateAsync({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        user: '' as any,
        actionType: T__1.general,
        details: `Superuser action failed: Generate audit summary - ${error.message}`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: false,
        severity: T__2.warning,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Superuser Audit Actions
        </CardTitle>
        <CardDescription>
          Advanced audit operations for App Controller and Security users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Privileged operations:</strong> All actions in this panel are logged in the audit trail.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Export Filtered Logs */}
          <Button
            variant="outline"
            onClick={handleExportCurrent}
            disabled={isExporting || currentLogs.length === 0}
            className="justify-start h-auto py-3 px-4"
          >
            <div className="flex items-start gap-3 w-full">
              <Download className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="font-medium">Export Filtered Logs</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Download current view ({currentLogs.length} entries)
                </div>
              </div>
            </div>
          </Button>

          {/* Export Complete Audit Log */}
          <Button
            variant="outline"
            onClick={handleExportAll}
            disabled={isExporting}
            className="justify-start h-auto py-3 px-4"
          >
            <div className="flex items-start gap-3 w-full">
              {isExporting ? (
                <Loader2 className="h-5 w-5 mt-0.5 flex-shrink-0 animate-spin" />
              ) : (
                <Database className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-left flex-1">
                <div className="font-medium">Export Complete Log</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Download all audit entries
                </div>
              </div>
            </div>
          </Button>

          {/* Export Flagged Users */}
          <Button
            variant="outline"
            onClick={handleExportFlaggedUsers}
            disabled={isProcessing || !flaggedUsers || flaggedUsers.length === 0}
            className="justify-start h-auto py-3 px-4"
          >
            <div className="flex items-start gap-3 w-full">
              <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="font-medium">Export Flagged Users</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Download list of flagged users ({flaggedUsers?.length || 0})
                </div>
              </div>
            </div>
          </Button>

          {/* Record Admin Note */}
          <Button
            variant="outline"
            onClick={handleRecordAdminNote}
            disabled={isProcessing}
            className="justify-start h-auto py-3 px-4"
          >
            <div className="flex items-start gap-3 w-full">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 mt-0.5 flex-shrink-0 animate-spin" />
              ) : (
                <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-left flex-1">
                <div className="font-medium">Record Admin Note</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Add checkpoint to audit log
                </div>
              </div>
            </div>
          </Button>

          {/* Generate Audit Summary */}
          <Button
            variant="outline"
            onClick={handleGenerateAuditSummary}
            disabled={isProcessing || currentLogs.length === 0}
            className="justify-start h-auto py-3 px-4 md:col-span-2"
          >
            <div className="flex items-start gap-3 w-full">
              <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="font-medium">Generate Audit Summary</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Create summary report of current view
                </div>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
