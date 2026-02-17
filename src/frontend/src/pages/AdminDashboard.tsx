import { useGetAuditLogs } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import IcpConnectionPanel from '../components/IcpConnectionPanel';
import AuthStatusPanel from '../components/AuthStatusPanel';
import RolesAccessPanel from '../components/RolesAccessPanel';
import IcpControlsPanel from '../components/IcpControlsPanel';
import RealTimeAlertPanel from '../components/RealTimeAlertPanel';
import SecuritySummaryPanel from '../components/SecuritySummaryPanel';
import SuperuserAuditPanel from '../components/SuperuserAuditPanel';
import RootTerminalPanel from '../components/RootTerminalPanel';
import BroadcastConfigPanel from '../components/BroadcastConfigPanel';
import UserManagementPanel from '../components/UserManagementPanel';
import IcpControllerManagementPanel from '../components/IcpControllerManagementPanel';
import WorldWideWebControllerManagementPanel from '../components/WorldWideWebControllerManagementPanel';
import DeploymentPanel from '../components/DeploymentPanel';
import IcpMainnetDeploymentPanel from '../components/IcpMainnetDeploymentPanel';
import CodeEditorPanel from '../components/CodeEditorPanel';
import { commandRegistry } from '../terminal/commandRegistry';

export default function AdminDashboard() {
  const { data: currentLogs = [] } = useGetAuditLogs({});

  return (
    <div className="container py-6 sm:py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-white">
          <Crown className="h-4 w-4" />
          Security Dashboard
        </Badge>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <IcpConnectionPanel />
        <AuthStatusPanel />
      </div>

      <RolesAccessPanel />

      <IcpControlsPanel />

      <RealTimeAlertPanel logs={currentLogs} />

      <SecuritySummaryPanel logs={currentLogs} />

      <SuperuserAuditPanel currentLogs={currentLogs} />

      <RootTerminalPanel
        commandRegistry={commandRegistry}
        title="Root Terminal"
        description="Security/App Controller command interface with full system access"
      />

      <BroadcastConfigPanel />

      <UserManagementPanel />

      <IcpControllerManagementPanel />

      <WorldWideWebControllerManagementPanel />

      <DeploymentPanel />

      <IcpMainnetDeploymentPanel />

      <CodeEditorPanel />
    </div>
  );
}
