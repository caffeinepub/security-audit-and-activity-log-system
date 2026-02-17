/**
 * Import/Export utilities for ICP Controls configuration
 */

import type { IcpControlsState } from '../icp-controls/bindings';
import { CONTROLS } from '../icp-controls/registry';
import { validateControlValue, parseControlValue } from '../icp-controls/bindings';

export interface ExportedConfig {
  version: string;
  timestamp: string;
  controls: IcpControlsState;
}

/**
 * Export current configuration to JSON
 */
export function exportConfiguration(config: IcpControlsState): string {
  const exported: ExportedConfig = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    controls: config,
  };
  
  return JSON.stringify(exported, null, 2);
}

/**
 * Download configuration as JSON file
 */
export function downloadConfiguration(config: IcpControlsState, filename = 'icp-controls-config.json') {
  const json = exportConfiguration(config);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported configuration
 */
export function importConfiguration(jsonString: string): { config: IcpControlsState; errors: string[] } {
  const errors: string[] = [];
  const config: IcpControlsState = {};
  
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!parsed.controls || typeof parsed.controls !== 'object') {
      errors.push('Invalid configuration format: missing or invalid "controls" object');
      return { config, errors };
    }
    
    // Validate each control
    for (const [controlId, value] of Object.entries(parsed.controls)) {
      const control = CONTROLS.find(c => c.id === controlId);
      
      if (!control) {
        errors.push(`Unknown control: ${controlId}`);
        continue;
      }
      
      const validationError = validateControlValue(control, value);
      if (validationError) {
        errors.push(validationError);
        continue;
      }
      
      config[controlId] = value;
    }
    
    if (errors.length > 0) {
      return { config: {}, errors };
    }
    
    return { config, errors: [] };
  } catch (error: any) {
    errors.push(`Failed to parse JSON: ${error.message}`);
    return { config: {}, errors };
  }
}

/**
 * Read configuration from uploaded file
 */
export function readConfigurationFile(file: File): Promise<{ config: IcpControlsState; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importConfiguration(content);
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({
        config: {},
        errors: ['Failed to read file'],
      });
    };
    
    reader.readAsText(file);
  });
}
