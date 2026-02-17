import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useIcpControls } from '../hooks/useIcpControls';
import type { NetworkType } from '../utils/icpControls';

export default function IcpControlsPanel() {
  const { config, defaults, setNetwork, setCanisterId, resetToDefaults, hasOverrides, networkLabel, validateCanisterId } = useIcpControls();
  
  const [localCanisterId, setLocalCanisterId] = useState(config.canisterId);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const handleNetworkChange = (value: string) => {
    setNetwork(value as NetworkType);
    setSuccessMessage('Network updated successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const handleCanisterIdChange = (value: string) => {
    setLocalCanisterId(value);
    setValidationError(null);
    setSuccessMessage(null);
  };
  
  const handleCanisterIdApply = () => {
    const error = validateCanisterId(localCanisterId);
    if (error) {
      setValidationError(error);
      return;
    }
    
    try {
      setCanisterId(localCanisterId);
      setValidationError(null);
      setSuccessMessage('Canister ID updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setValidationError(err.message);
    }
  };
  
  const handleReset = () => {
    resetToDefaults();
    setLocalCanisterId(defaults.canisterId);
    setValidationError(null);
    setSuccessMessage('Settings reset to defaults');
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          ICP Controls
        </CardTitle>
        <CardDescription>
          Configure network and canister settings for backend connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {successMessage && (
          <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="network">Network</Label>
            <Select value={config.network} onValueChange={handleNetworkChange}>
              <SelectTrigger id="network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="mainnet">ICP Mainnet</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current: {networkLabel}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="canisterId">Canister ID</Label>
            <div className="flex gap-2">
              <Input
                id="canisterId"
                value={localCanisterId}
                onChange={(e) => handleCanisterIdChange(e.target.value)}
                placeholder="Enter canister ID"
                className="font-mono text-sm"
              />
              <Button onClick={handleCanisterIdApply} size="sm">
                Apply
              </Button>
            </div>
            <p className="text-xs text-muted-foreground break-all">
              Current: {config.canisterId}
            </p>
          </div>
        </div>
        
        {hasOverrides && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Custom settings are active. Using overrides from session storage or URL parameters.</span>
              <Button onClick={handleReset} variant="outline" size="sm" className="ml-4">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {!hasOverrides && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Using default configuration
          </div>
        )}
      </CardContent>
    </Card>
  );
}
