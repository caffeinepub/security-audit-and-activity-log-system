import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIcpControls } from '../hooks/useIcpControls';
import { downloadConfiguration, readConfigurationFile } from '../utils/icpControlsImportExport';
import { worldWideWebControllerCommandRegistry } from '../terminal/worldWideWebControllerCommands';
import { Copy, Download, Upload, RotateCcw, RefreshCw, Wrench, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function WebControlQuickToolsPanel() {
  const { identity } = useInternetIdentity();
  const { getEffectiveSnapshot, applyImportedConfig, resetToDefaults } = useIcpControls();
  const [isResetting, setIsResetting] = useState(false);

  const handleCopyPrincipal = () => {
    if (!identity) {
      toast.error('Not authenticated');
      return;
    }
    
    const principal = identity.getPrincipal().toString();
    navigator.clipboard.writeText(principal);
    toast.success('Principal copied to clipboard');
  };

  const handleExportConfig = () => {
    try {
      const config = getEffectiveSnapshot();
      downloadConfiguration(config);
      toast.success('Configuration exported successfully');
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const { config, errors } = await readConfigurationFile(file);
        
        if (errors.length > 0) {
          toast.error(`Import failed:\n${errors.join('\n')}`);
          return;
        }
        
        applyImportedConfig(config);
        toast.success('Configuration imported successfully');
      } catch (error: any) {
        toast.error(`Import failed: ${error.message}`);
      }
    };
    
    input.click();
  };

  const handleResetConfig = async () => {
    if (!confirm('Reset all ICP Controls to default values? This cannot be undone.')) {
      return;
    }
    
    setIsResetting(true);
    try {
      resetToDefaults();
      toast.success('Configuration reset to defaults');
    } catch (error: any) {
      toast.error(`Reset failed: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleRefreshConnection = () => {
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-emerald-600" />
          Web Controller Tools
        </CardTitle>
        <CardDescription>
          Client-side utilities for World Wide Web Controller users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Client-side tools only.</strong> These actions operate on your browser's local configuration and diagnostics. 
            No security, audit, administrative, or privileged backend access is provided through this panel.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium mb-2">Principal Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrincipal}
                disabled={!identity}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Principal
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">ICP Controls Configuration</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportConfig}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportConfig}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetConfig}
                disabled={isResetting}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {isResetting ? 'Resetting...' : 'Reset to Defaults'}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Connection Tools</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshConnection}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Connection
              </Button>
            </div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            For advanced operations, use the Web Control Terminal below. Type "help" to see all {worldWideWebControllerCommandRegistry.length}+ available commands.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
