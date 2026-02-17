/**
 * ICP Controls utilities for network and canister configuration
 */

import { Principal } from '@dfinity/principal';

export type NetworkType = 'local' | 'mainnet';

export interface IcpControlsConfig {
  network: NetworkType;
  canisterId: string;
}

export interface IcpControlsDefaults {
  network: NetworkType;
  canisterId: string;
}

/**
 * Get default ICP configuration based on current environment
 */
export function getIcpControlsDefaults(): IcpControlsDefaults {
  const host = window.location.hostname;
  
  // Determine network from hostname
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const network: NetworkType = isLocal ? 'local' : 'mainnet';
  
  // Extract canister ID from hostname or use placeholder
  let canisterId = 'Not available';
  if (!isLocal) {
    const parts = host.split('.');
    if (parts.length > 0 && parts[0].length > 10) {
      canisterId = parts[0];
    }
  }
  
  return { network, canisterId };
}

/**
 * Validate canister ID format
 * Returns error message if invalid, null if valid
 */
export function validateCanisterId(canisterId: string): string | null {
  if (!canisterId || canisterId.trim() === '') {
    return 'Canister ID cannot be empty';
  }
  
  const trimmed = canisterId.trim();
  
  // Check if it's a placeholder value
  if (trimmed === 'Not available' || trimmed === 'Not available in local development') {
    return null; // Allow placeholder values
  }
  
  // Try to parse as Principal to validate format
  try {
    Principal.fromText(trimmed);
    return null; // Valid
  } catch (error) {
    return 'Invalid canister ID format. Must be a valid principal text.';
  }
}

/**
 * Get network display label
 */
export function getNetworkLabel(network: NetworkType): string {
  return network === 'local' ? 'Local' : 'ICP Mainnet';
}

/**
 * Get host URL for network
 */
export function getHostForNetwork(network: NetworkType): string {
  return network === 'local' ? 'http://127.0.0.1:4943' : 'https://icp-api.io';
}
