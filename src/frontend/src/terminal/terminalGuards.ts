import type { TerminalContext } from './types';
import type { T as AuditEntry } from '../backend';
import { T__1, T__2 } from '../backend';

/**
 * Best-effort audit recording that never throws.
 * Returns a warning message if audit recording fails, or null if successful.
 */
export async function tryRecordAuditEntry(
  context: TerminalContext,
  entry: Omit<AuditEntry, 'user'> & { user?: any }
): Promise<string | null> {
  try {
    if (!context.actor) {
      return null; // Silently skip if backend not available
    }
    if (!context.identity) {
      return null; // Silently skip if not authenticated
    }
    await context.recordAuditEntry(entry);
    return null;
  } catch (error: any) {
    // Return warning but don't fail the command
    return `Warning: Audit recording failed - ${error.message}`;
  }
}

/**
 * Appends an audit warning to command output if present.
 */
export function appendAuditWarning(message: string, auditWarning: string | null): string {
  if (auditWarning) {
    return `${message}\n\n${auditWarning}`;
  }
  return message;
}

/**
 * Classifies common terminal command errors into user-friendly messages.
 */
export function classifyError(error: any, context: TerminalContext): string {
  const errorMessage = error?.message || String(error);

  // Backend connection missing
  if (!context.actor) {
    return 'Backend connection not available. Please check the "ICP Connection Status" and "Authentication Status" panels.';
  }

  // Login required
  if (!context.identity) {
    return 'Login required. Please log in with Internet Identity to execute this command.';
  }

  // Authorization failures
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Only security users') ||
    errorMessage.includes('Only app controller') ||
    errorMessage.includes('Only admins')
  ) {
    return `Access denied: ${errorMessage}`;
  }

  // Generic error
  return errorMessage;
}

/**
 * Checks if the context has the required authentication and backend connection.
 */
export function requiresBackendAndAuth(context: TerminalContext): string | null {
  if (!context.actor) {
    return 'Backend connection not available. Please check the "ICP Connection Status" and "Authentication Status" panels.';
  }
  if (!context.identity) {
    return 'Login required. Please log in with Internet Identity to execute this command.';
  }
  return null;
}

/**
 * Format a timestamp (bigint nanoseconds) to a readable string.
 */
export function formatTimestamp(timestamp: bigint): string {
  try {
    const ms = Number(timestamp / BigInt(1_000_000));
    const date = new Date(ms);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'Invalid timestamp';
  }
}

/**
 * Parse a severity string to the backend enum type.
 */
export function parseSeverity(severity: string): any {
  const lower = severity.toLowerCase();
  if (lower === 'info') return T__2.info;
  if (lower === 'warning' || lower === 'warn') return T__2.warning;
  if (lower === 'critical' || lower === 'crit') return T__2.critical;
  return T__2.info; // Default
}

/**
 * Parse an action type string to the backend enum type.
 */
export function parseActionType(action: string): any {
  const lower = action.toLowerCase();
  if (lower === 'loginattempt' || lower === 'login') return T__1.loginAttempt;
  if (lower === 'permissionchange' || lower === 'permission') return T__1.permissionChange;
  if (lower === 'dataexport' || lower === 'export') return T__1.dataExport;
  if (lower === 'dataimport' || lower === 'import') return T__1.dataImport;
  if (lower === 'accountchange' || lower === 'account') return T__1.accountChange;
  if (lower === 'unauthorizedattempt' || lower === 'unauthorized') return T__1.unauthorizedAttempt;
  if (lower === 'configupload' || lower === 'config') return T__1.configUpload;
  return T__1.general; // Default
}
