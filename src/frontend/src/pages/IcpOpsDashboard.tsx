import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Server } from 'lucide-react';
import IcpConnectionPanel from '../components/IcpConnectionPanel';
import IcpControlsPanel from '../components/IcpControlsPanel';
import AuthStatusPanel from '../components/AuthStatusPanel';
import RootTerminalPanel from '../components/RootTerminalPanel';
import { icpControllerCommandRegistry } from '../terminal/icpControllerCommands';

interface IcpOpsDashboardProps {
  showAccessGranted?: boolean;
}

export default function IcpOpsDashboard({ showAccessGranted }: IcpOpsDashboardProps) {
  return (
    <div className="container py-8 space-y-8">
      {showAccessGranted && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            <strong>ICP Controller Access Granted</strong> — You have access to ICP connectivity and configuration operations.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Server className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ICP Operations Console</h1>
            <p className="text-muted-foreground">
              Manage Internet Computer connectivity, configuration, and authentication
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <IcpConnectionPanel />
        <AuthStatusPanel />
        <IcpControlsPanel />
        <RootTerminalPanel
          commandRegistry={icpControllerCommandRegistry}
          title="ICP Controller Terminal"
          description="Execute ICP connectivity and profile commands"
        />
      </div>
    </div>
  );
}
