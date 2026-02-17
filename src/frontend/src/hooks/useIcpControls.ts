import { useState, useEffect, useCallback } from 'react';
import { getUrlParameter, storeSessionParameter, getSessionParameter, clearSessionParameter } from '../utils/urlParams';
import { getIcpControlsDefaults, validateCanisterId, getNetworkLabel, type NetworkType, type IcpControlsConfig } from '../utils/icpControls';

const NETWORK_SESSION_KEY = 'icp_network';
const CANISTER_ID_SESSION_KEY = 'icp_canister_id';

export function useIcpControls() {
  const defaults = getIcpControlsDefaults();
  
  // Compute effective configuration with precedence: URL -> sessionStorage -> defaults
  const getEffectiveConfig = useCallback((): IcpControlsConfig => {
    // Check URL parameters first
    const urlNetwork = getUrlParameter('network') as NetworkType | null;
    const urlCanisterId = getUrlParameter('canisterId');
    
    // Get session storage values
    const sessionNetwork = getSessionParameter(NETWORK_SESSION_KEY) as NetworkType | null;
    const sessionCanisterId = getSessionParameter(CANISTER_ID_SESSION_KEY);
    
    // Apply precedence
    const network = urlNetwork || sessionNetwork || defaults.network;
    const canisterId = urlCanisterId || sessionCanisterId || defaults.canisterId;
    
    // Store URL values in session if present
    if (urlNetwork) {
      storeSessionParameter(NETWORK_SESSION_KEY, urlNetwork);
    }
    if (urlCanisterId) {
      storeSessionParameter(CANISTER_ID_SESSION_KEY, urlCanisterId);
    }
    
    return { network, canisterId };
  }, [defaults]);
  
  const [config, setConfig] = useState<IcpControlsConfig>(getEffectiveConfig);
  
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
  
  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    clearSessionParameter(NETWORK_SESSION_KEY);
    clearSessionParameter(CANISTER_ID_SESSION_KEY);
    setConfig(defaults);
  }, [defaults]);
  
  // Check if using overrides
  const hasOverrides = config.network !== defaults.network || config.canisterId !== defaults.canisterId;
  
  return {
    config,
    defaults,
    setNetwork,
    setCanisterId,
    resetToDefaults,
    hasOverrides,
    networkLabel: getNetworkLabel(config.network),
    validateCanisterId,
  };
}
