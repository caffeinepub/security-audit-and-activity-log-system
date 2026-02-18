import SecuritySummaryPanel from '../components/SecuritySummaryPanel';
import RealTimeAlertPanel from '../components/RealTimeAlertPanel';
import UserManagementPanel from '../components/UserManagementPanel';
import BroadcastConfigPanel from '../components/BroadcastConfigPanel';
import TestActionsPanel from '../components/TestActionsPanel';
import DeploymentPanel from '../components/DeploymentPanel';
import CodeEditorPanel from '../components/CodeEditorPanel';
import IcpConnectionPanel from '../components/IcpConnectionPanel';
import AuthStatusPanel from '../components/AuthStatusPanel';
import IcpMainnetDeploymentPanel from '../components/IcpMainnetDeploymentPanel';
import SuperuserAuditPanel from '../components/SuperuserAuditPanel';
import RootTerminalPanel from '../components/RootTerminalPanel';
import { commandRegistry } from '../terminal/commandRegistry';
import IcpControlsPanel from '../components/IcpControlsPanel';
import IcpControllerManagementPanel from '../components/IcpControllerManagementPanel';
import RolesAccessPanel from '../components/RolesAccessPanel';
import WorldWideWebControllerManagementPanel from '../components/WorldWideWebControllerManagementPanel';
import { useGetAuditLogs } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
  const [auditFilter] = useState({
    fromDate: undefined,
    toDate: undefined,
    user: undefined,
    actionType: undefined,
    severity: undefined,
  });

  const auditLogsQuery = useGetAuditLogs(auditFilter);

  const handleRefreshAuditLogs = () => {
    auditLogsQuery.refetch();
  };

  const auditLogs = auditLogsQuery.data || [];

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <SecuritySummaryPanel logs={auditLogs} />
        <RealTimeAlertPanel logs={auditLogs} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Recent Audit Logs</CardTitle>
            <CardDescription>Latest security events and activities</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAuditLogs}
            disabled={auditLogsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${auditLogsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {auditLogsQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : auditLogsQuery.isError ? (
            <div className="text-center py-8 text-destructive">Failed to load audit logs</div>
          ) : (
            <div className="space-y-2">
              {auditLogs.length > 0 ? (
                <div className="text-sm text-muted-foreground">
                  Showing {auditLogs.length} recent entries
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <UserManagementPanel />
        <BroadcastConfigPanel />
      </div>

      <SuperuserAuditPanel currentLogs={auditLogs} />

      <TestActionsPanel />

      <RootTerminalPanel
        commandRegistry={commandRegistry}
        title="Security Dashboard Terminal"
        description="Execute security and administrative commands"
      />

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <IcpConnectionPanel />
        <AuthStatusPanel />
      </div>

      <IcpControlsPanel />

      <RolesAccessPanel />

      <IcpControllerManagementPanel />

      <WorldWideWebControllerManagementPanel />

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <DeploymentPanel />
        <IcpMainnetDeploymentPanel />
      </div>

      <CodeEditorPanel />
    </div>
  );
}
