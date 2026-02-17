/**
 * Bindings between registry control IDs and useIcpControls configuration
 */

import type { ControlDefinition } from './types';
import { CONTROLS } from './registry';

export interface IcpControlsState {
  [key: string]: any;
}

/**
 * Get control definition by ID
 */
export function getControlById(id: string): ControlDefinition | undefined {
  return CONTROLS.find(c => c.id === id);
}

/**
 * Parse value from string (for URL/session storage)
 */
export function parseControlValue(control: ControlDefinition, value: string): any {
  switch (control.type) {
    case 'boolean':
      return value === 'true';
    case 'number':
    case 'slider':
      return Number(value);
    case 'select':
    case 'text':
    case 'textarea':
    default:
      return value;
  }
}

/**
 * Serialize value to string (for URL/session storage)
 */
export function serializeControlValue(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

/**
 * Validate control value
 */
export function validateControlValue(control: ControlDefinition, value: any): string | null {
  if (control.type === 'number' || control.type === 'slider') {
    const num = Number(value);
    if (isNaN(num)) {
      return `${control.title} must be a number`;
    }
    if (control.min !== undefined && num < control.min) {
      return `${control.title} must be at least ${control.min}`;
    }
    if (control.max !== undefined && num > control.max) {
      return `${control.title} must be at most ${control.max}`;
    }
  }
  
  if (control.type === 'select' && control.options) {
    const validValues = control.options.map(o => o.value);
    if (!validValues.includes(value)) {
      return `${control.title} must be one of: ${validValues.join(', ')}`;
    }
  }
  
  return null;
}

/**
 * Get session storage key for control
 */
export function getSessionKey(controlId: string): string {
  return `icp_control_${controlId}`;
}
