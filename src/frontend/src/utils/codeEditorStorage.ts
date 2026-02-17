// Utility for managing code editor state in browser localStorage

export interface FileState {
  content: string;
  appliedContent: string | null;
  appliedTimestamp: number | null;
}

export interface SupportedFile {
  path: string;
  category: 'Backend' | 'Frontend';
  label: string;
  defaultContent: string;
}

export const SUPPORTED_FILES: SupportedFile[] = [
  {
    path: 'backend/main.mo',
    category: 'Backend',
    label: 'backend/main.mo',
    defaultContent: '// Backend Motoko code\n// Edit your backend logic here\n\nactor {\n  // Your code here\n}',
  },
  {
    path: 'frontend/src/App.tsx',
    category: 'Frontend',
    label: 'frontend/src/App.tsx',
    defaultContent: '// Frontend React/TypeScript code\n// Edit your App component here\n\nimport React from "react";\n\nexport default function App() {\n  return <div>Your app</div>;\n}',
  },
];

const STORAGE_KEY_PREFIX = 'code_editor_';

export function getStorageKey(filePath: string): string {
  return `${STORAGE_KEY_PREFIX}${filePath.replace(/\//g, '_')}`;
}

export function loadFileState(filePath: string): FileState {
  const key = getStorageKey(filePath);
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored file state:', e);
    }
  }
  
  // Return default state
  const file = SUPPORTED_FILES.find(f => f.path === filePath);
  return {
    content: file?.defaultContent || '',
    appliedContent: null,
    appliedTimestamp: null,
  };
}

export function saveFileState(filePath: string, state: FileState): void {
  const key = getStorageKey(filePath);
  localStorage.setItem(key, JSON.stringify(state));
}

export function applyChanges(filePath: string, content: string): void {
  const state: FileState = {
    content,
    appliedContent: content,
    appliedTimestamp: Date.now(),
  };
  saveFileState(filePath, state);
}

export function updateContent(filePath: string, content: string): void {
  const currentState = loadFileState(filePath);
  const newState: FileState = {
    ...currentState,
    content,
  };
  saveFileState(filePath, newState);
}

export function hasUnsavedChanges(filePath: string): boolean {
  const state = loadFileState(filePath);
  const baseline = state.appliedContent !== null ? state.appliedContent : getDefaultContent(filePath);
  return state.content !== baseline;
}

export function getDefaultContent(filePath: string): string {
  const file = SUPPORTED_FILES.find(f => f.path === filePath);
  return file?.defaultContent || '';
}

export function resetToBaseline(filePath: string): string {
  const state = loadFileState(filePath);
  const baseline = state.appliedContent !== null ? state.appliedContent : getDefaultContent(filePath);
  
  const newState: FileState = {
    ...state,
    content: baseline,
  };
  saveFileState(filePath, newState);
  
  return baseline;
}

export function getAppliedTimestamp(filePath: string): number | null {
  const state = loadFileState(filePath);
  return state.appliedTimestamp;
}

export function isApplied(filePath: string): boolean {
  const state = loadFileState(filePath);
  return state.appliedContent !== null;
}
