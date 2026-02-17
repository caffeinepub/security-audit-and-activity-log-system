import { Badge } from '@/components/ui/badge';
import { Server, Globe } from 'lucide-react';
import IcpConnectionPanel from '../components/IcpConnectionPanel';
import AuthStatusPanel from '../components/AuthStatusPanel';
import RolesAccessPanel from '../components/RolesAccessPanel';
import IcpControlsPanel from '../components/IcpControlsPanel';
import RootTerminalPanel from '../components/RootTerminalPanel';
import { icpControllerCommandRegistry } from '../terminal/icpControllerCommands';
import { worldWideWebControllerCommandRegistry } from '../terminal/worldWideWebControllerCommands';
import { useGetCallerIcpControllerStatus, useGetCallerWorldWideWebControllerStatus } from '../hooks/useQueries';

export default function IcpOpsDashboard() {
  const { data: isIcpController } = useGetCallerIcpControllerStatus();
  const { data: isWorldWideWebController } = useGetCallerWorldWideWebControllerStatus();

  // ICP Controller takes precedence if both roles are present
  const isUsingIcpControllerTerminal = isIcpController === true;
  const isUsingWebControlTerminal = !isUsingIcpControllerTerminal && isWorldWideWebController === true;

  const getRoleBadge = () => {
    if (isIcpController) {
      return (
        <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1 text-white">
          <Server className="h-4 w-4" />
          ICP Operations Console
        </Badge>
      );
    }
    if (isWorldWideWebController) {
      return (
        <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-white">
          <Globe className="h-4 w-4" />
          ICP Operations Console (Web Control)
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1 text-white">
        <Server className="h-4 w-4" />
        ICP Operations Console
      </Badge>
    );
  };

  const getTerminalConfig = () => {
    if (isUsingIcpControllerTerminal) {
      return {
        commandRegistry: icpControllerCommandRegistry,
        title: 'ICP Operations Terminal',
        description: 'ICP Controller command interface for operational tasks',
      };
    }
    if (isUsingWebControlTerminal) {
      return {
        commandRegistry: worldWideWebControllerCommandRegistry,
        title: 'Web Control Terminal',
        description: 'World Wide Web Controller command interface for web operations',
      };
    }
    // Default fallback (should not normally be reached)
    return {
      commandRegistry: icpControllerCommandRegistry,
      title: 'ICP Operations Terminal',
      description: 'ICP Controller command interface for operational tasks',
    };
  };

  const terminalConfig = getTerminalConfig();

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-3">
        {getRoleBadge()}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <IcpConnectionPanel />
        <AuthStatusPanel />
      </div>

      <RolesAccessPanel />

      <IcpControlsPanel />

      <RootTerminalPanel
        commandRegistry={terminalConfig.commandRegistry}
        title={terminalConfig.title}
        description={terminalConfig.description}
      />
    </div>
  );
}
