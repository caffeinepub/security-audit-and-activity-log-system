import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import IcpConnectionPanel from '../components/IcpConnectionPanel';
import AuthStatusPanel from '../components/AuthStatusPanel';
import IcpControlsCatalog from '../components/IcpControlsCatalog';
import RootTerminalPanel from '../components/RootTerminalPanel';
import RolesAccessPanel from '../components/RolesAccessPanel';
import { icpControllerCommandRegistry } from '../terminal/icpControllerCommands';

export default function IcpOpsDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">ICP Operations Console</h1>
          <Badge variant="outline" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            ICP Controller
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <IcpConnectionPanel />
          <AuthStatusPanel />
        </div>

        <RolesAccessPanel />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ICP Controls Catalog
            </CardTitle>
            <CardDescription>
              Configure ICP network settings and operational parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IcpControlsCatalog />
          </CardContent>
        </Card>

        <RootTerminalPanel
          commandRegistry={icpControllerCommandRegistry}
          title="ICP Controller Terminal"
          description="Execute operational commands for ICP configuration and connectivity"
        />
      </main>
    </div>
  );
}
