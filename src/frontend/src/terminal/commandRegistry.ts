import { coreCommands } from './coreCommands';
import type { TerminalCommand } from './types';

export const commandRegistry: TerminalCommand[] = [...coreCommands];
