/**
 * Type definitions for ICP Controls registry
 */

export type ControlCategory =
  | 'network'
  | 'agent'
  | 'performance'
  | 'security'
  | 'diagnostics'
  | 'features'
  | 'experimental'
  | 'advanced';

export type ControlType =
  | 'select'
  | 'text'
  | 'number'
  | 'boolean'
  | 'slider'
  | 'textarea';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ControlDefinition {
  id: string;
  title: string;
  description?: string;
  keywords: string[];
  category: ControlCategory;
  type: ControlType;
  defaultValue: any;
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
}

export interface CategoryDefinition {
  id: ControlCategory;
  label: string;
  description: string;
  icon: string;
}
