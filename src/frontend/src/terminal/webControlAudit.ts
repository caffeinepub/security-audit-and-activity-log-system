/**
 * Shared audit wrapper for Web Control commands.
 * Ensures best-effort audit recording and consistent error handling.
 */

import type { TerminalContext, TerminalOutput } from './types';
import { tryRecordAuditEntry, appendAuditWarning, classifyError } from './terminalGuards';
import { T__1, T__2 } from '../backend';

/**
 * Execute a Web Control command with best-effort audit recording.
 * Never fails due to audit unavailability.
 */
export async function executeWithAudit(
  context: TerminalContext,
  auditDetails: string,
  commandLogic: () => Promise<TerminalOutput>
): Promise<TerminalOutput> {
  try {
    // Execute the command logic
    const result = await commandLogic();
    
    // Attempt to record audit entry (best-effort)
    const auditWarning = await tryRecordAuditEntry(context, {
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      actionType: T__1.general,
      details: auditDetails,
      ipAddress: undefined,
      deviceInfo: undefined,
      sessionData: undefined,
      success: result.success,
      severity: T__2.info,
    });
    
    // Append audit warning if present
    if (auditWarning && result.message) {
      result.message = appendAuditWarning(result.message, auditWarning);
    }
    
    return result;
  } catch (error: any) {
    // Classify and return error
    return {
      success: false,
      message: classifyError(error, context),
    };
  }
}

/**
 * Execute a local-only command (help, clear) with optional audit recording.
 */
export async function executeLocalCommand(
  context: TerminalContext,
  commandName: string,
  commandLogic: () => Promise<TerminalOutput>
): Promise<TerminalOutput> {
  try {
    const result = await commandLogic();
    
    // Only attempt audit if backend is available (best-effort)
    if (context.actor && context.identity) {
      await tryRecordAuditEntry(context, {
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        actionType: T__1.general,
        details: `Local command executed: ${commandName}`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: true,
        severity: T__2.info,
      });
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: classifyError(error, context),
    };
  }
}
