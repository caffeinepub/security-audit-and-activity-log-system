import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Shield, Loader2, CheckCircle2, AlertTriangle, FileText, Users, Database } from 'lucide-react';
import { useExportAuditLog, useRecordAuditEntry, useGetFlaggedUsers } from '../hooks/useQueries';
import type { T as AuditEntry } from '../backend';
import { T__1, T__2 } from '../backend';
import { toast } from 'sonner';

interface SuperuserAuditPanelProps {
  currentLogs: AuditEntry[];
}

export default function SuperuserAuditPanel({ currentLogs }: SuperuserAuditPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const exportAuditLog = useExportAuditLog();
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
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          Superuser Audit Controls
        </CardTitle>
        <CardDescription>
          Export audit logs, manage flagged users, and perform administrative actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            <strong>Security Notice:</strong> All superuser actions are logged in the audit trail. 
            Exported data contains sensitive information and should be handled according to your security policies.
          </AlertDescription>
        </Alert>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Current View
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Export filtered logs ({currentLogs.length} entries)
            </p>
            <Button
              onClick={handleExportCurrent}
              disabled={isExporting || currentLogs.length === 0}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Filtered
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Export Complete Trail
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Export all audit logs (complete)
            </p>
            <Button
              onClick={handleExportAll}
              disabled={isExporting}
              variant="default"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              size="sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Export Flagged Users
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Download flagged user list ({flaggedUsers?.length || 0})
            </p>
            <Button
              onClick={handleExportFlaggedUsers}
              disabled={isProcessing || !flaggedUsers || flaggedUsers.length === 0}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Export Flagged
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Record Admin Note
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Add administrative checkpoint
            </p>
            <Button
              onClick={handleRecordAdminNote}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Record Note
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Generate Summary
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Create audit summary report
            </p>
            <Button
              onClick={handleGenerateAuditSummary}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>All superuser actions are logged with success/failure status and exported as JSON with full metadata</span>
        </div>
      </CardContent>
    </Card>
  );
}
