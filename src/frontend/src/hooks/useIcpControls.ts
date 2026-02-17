import { useState, useEffect, useCallback } from 'react';
import { getUrlParameter, storeSessionParameter, getSessionParameter, clearSessionParameter } from '../utils/urlParams';
import { getIcpControlsDefaults, validateCanisterId, getNetworkLabel, type NetworkType, type IcpControlsConfig } from '../utils/icpControls';
import { CONTROLS } from '../icp-controls/registry';
import { getSessionKey, parseControlValue, serializeControlValue, validateControlValue, type IcpControlsState } from '../icp-controls/bindings';

const NETWORK_SESSION_KEY = 'icp_network';
const CANISTER_ID_SESSION_KEY = 'icp_canister_id';

export function useIcpControls() {
  const defaults = getIcpControlsDefaults();
  
  // Compute effective configuration with precedence: URL -> sessionStorage -> defaults
  const getEffectiveConfig = useCallback((): IcpControlsConfig & IcpControlsState => {
    // Check URL parameters first
    const urlNetwork = getUrlParameter('network') as NetworkType | null;
    const urlCanisterId = getUrlParameter('canisterId');
    
    // Get session storage values
    const sessionNetwork = getSessionParameter(NETWORK_SESSION_KEY) as NetworkType | null;
    const sessionCanisterId = getSessionParameter(CANISTER_ID_SESSION_KEY);
    
    // Apply precedence for core settings
    const network = urlNetwork || sessionNetwork || defaults.network;
    const canisterId = urlCanisterId || sessionCanisterId || defaults.canisterId;
    
    // Store URL values in session if present
    if (urlNetwork) {
      storeSessionParameter(NETWORK_SESSION_KEY, urlNetwork);
    }
    if (urlCanisterId) {
      storeSessionParameter(CANISTER_ID_SESSION_KEY, urlCanisterId);
    }
    
    // Load additional controls from registry
    const additionalControls: IcpControlsState = {};
    CONTROLS.forEach(control => {
      // Skip core controls (network, canisterId)
      if (control.id === 'network' || control.id === 'canisterId') {
        return;
      }
      
      const urlValue = getUrlParameter(control.id);
      const sessionValue = getSessionParameter(getSessionKey(control.id));
      
      if (urlValue) {
        const parsed = parseControlValue(control, urlValue);
        additionalControls[control.id] = parsed;
        storeSessionParameter(getSessionKey(control.id), urlValue);
      } else if (sessionValue) {
        additionalControls[control.id] = parseControlValue(control, sessionValue);
      } else {
        additionalControls[control.id] = control.defaultValue;
      }
    });
    
    return { network, canisterId, ...additionalControls };
  }, [defaults]);
  
  const [config, setConfig] = useState<IcpControlsConfig & IcpControlsState>(getEffectiveConfig);
  
  // Update network setting
  const setNetwork = useCallback((network: NetworkType) => {
    storeSessionParameter(NETWORK_SESSION_KEY, network);
    setConfig(prev => ({ ...prev, network }));
  }, []);
  
  // Update canister ID setting
  const setCanisterId = useCallback((canisterId: string) => {
    const error = validateCanisterId(canisterId);
    if (error) {
      throw new Error(error);
    }
    storeSessionParameter(CANISTER_ID_SESSION_KEY, canisterId);
    setConfig(prev => ({ ...prev, canisterId }));
  }, []);
  
  // Update any control value
  const setControlValue = useCallback((controlId: string, value: any) => {
    const control = CONTROLS.find(c => c.id === controlId);
    if (!control) {
      throw new Error(`Unknown control: ${controlId}`);
    }
    
    const error = validateControlValue(control, value);
    if (error) {
      throw new Error(error);
    }
    
    storeSessionParameter(getSessionKey(controlId), serializeControlValue(value));
    setConfig(prev => ({ ...prev, [controlId]: value }));
  }, []);
  
  // Bulk update multiple controls
  const bulkUpdateControls = useCallback((updates: IcpControlsState) => {
    const errors: string[] = [];
    
    // Validate all updates first
    for (const [controlId, value] of Object.entries(updates)) {
      const control = CONTROLS.find(c => c.id === controlId);
      if (!control) {
        errors.push(`Unknown control: ${controlId}`);
        continue;
      }
      
      const error = validateControlValue(control, value);
      if (error) {
        errors.push(error);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join('\n')}`);
    }
    
    // Apply all updates
    for (const [controlId, value] of Object.entries(updates)) {
      storeSessionParameter(getSessionKey(controlId), serializeControlValue(value));
    }
    
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Get effective configuration snapshot for export
  const getEffectiveSnapshot = useCallback((): IcpControlsState => {
    return { ...config };
  }, [config]);
  
  // Apply imported configuration
  const applyImportedConfig = useCallback((importedConfig: IcpControlsState) => {
    bulkUpdateControls(importedConfig);
  }, [bulkUpdateControls]);
  
  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    // Clear core settings
    clearSessionParameter(NETWORK_SESSION_KEY);
    clearSessionParameter(CANISTER_ID_SESSION_KEY);
    
    // Clear all additional controls
    CONTROLS.forEach(control => {
      if (control.id !== 'network' && control.id !== 'canisterId') {
        clearSessionParameter(getSessionKey(control.id));
      }
    });
    
    setConfig(getEffectiveConfig());
  }, [getEffectiveConfig]);
  
  // Check if using overrides
  const hasOverrides = config.network !== defaults.network || 
                       config.canisterId !== defaults.canisterId ||
                       CONTROLS.some(control => {
                         if (control.id === 'network' || control.id === 'canisterId') return false;
                         return config[control.id] !== control.defaultValue;
                       });
  
  return {
    config,
    defaults,
    setNetwork,
    setCanisterId,
    setControlValue,
    bulkUpdateControls,
    getEffectiveSnapshot,
    applyImportedConfig,
    resetToDefaults,
    hasOverrides,
    networkLabel: getNetworkLabel(config.network),
    validateCanisterId,
  };
}
