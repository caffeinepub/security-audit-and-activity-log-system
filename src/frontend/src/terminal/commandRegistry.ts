import type { TerminalCommand } from './types';
import { coreCommands } from './coreCommands';

/**
 * Full command registry for Security/App Controller users.
 * This is the default registry used by the Security Dashboard terminal.
 */
export const commandRegistry: TerminalCommand[] = [...coreCommands];
