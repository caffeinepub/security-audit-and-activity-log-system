import type { TerminalCommand, TerminalContext, TerminalOutput } from './types';
import { tryRecordAuditEntry, appendAuditWarning, classifyError, requiresBackendAndAuth } from './terminalGuards';
import { T__1, T__2 } from '../backend';

/**
 * World Wide Web Controller-safe command registry.
 * Only includes commands that are safe for World Wide Web Controller role:
 * - help, clear (local)
 * - web-controller-status (role self-check)
 */

const helpCommand: TerminalCommand = {
  name: 'help',
  aliases: ['?', 'h'],
  description: 'Display available commands',
  category: 'General',
  usage: 'help [command]',
  execute: async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    if (args.length > 0) {
      const cmdName = args[0].toLowerCase();
      const cmd = worldWideWebControllerCommandRegistry.find(
        (c) => c.name === cmdName || c.aliases?.includes(cmdName)
      );
      if (cmd) {
        return {
          success: true,
          message: `Command: ${cmd.name}\nDescription: ${cmd.description}\nUsage: ${cmd.usage || cmd.name}\nCategory: ${cmd.category}`,
        };
      }
      return {
        success: false,
        message: `Command not found: ${cmdName}`,
      };
    }

    const categories = Array.from(new Set(worldWideWebControllerCommandRegistry.map((c) => c.category)));
    let output = 'Available Commands:\n\n';

    categories.forEach((category) => {
      output += `${category}:\n`;
      const cmds = worldWideWebControllerCommandRegistry.filter((c) => c.category === category);
      cmds.forEach((cmd) => {
        const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
        output += `  ${cmd.name}${aliases} - ${cmd.description}\n`;
      });
      output += '\n';
    });

    output += 'Type "help <command>" for detailed information about a specific command.';
    return { success: true, message: output };
  },
};

const clearCommand: TerminalCommand = {
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear the terminal screen',
  category: 'General',
  execute: async (): Promise<TerminalOutput> => {
    return { success: true, message: '', data: { clear: true } };
  },
};

const webControllerStatusCommand: TerminalCommand = {
  name: 'web-controller-status',
  description: 'Check your World Wide Web Controller role status',
  category: 'Web Control',
  execute: async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    const authCheck = requiresBackendAndAuth(context);
    if (authCheck) {
      return { success: false, message: authCheck };
    }

    try {
      const hasRole = await context.actor.hasWorldWideWebControllerRole();
      const principal = context.identity.getPrincipal().toString();

      const auditWarning = await tryRecordAuditEntry(context, {
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        actionType: T__1.general,
        details: 'World Wide Web Controller status check via terminal',
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: true,
        severity: T__2.info,
      });

      return {
        success: true,
        message: appendAuditWarning(
          `Principal: ${principal}\nWorld Wide Web Controller Role: ${hasRole ? 'Yes' : 'No'}`,
          auditWarning
        ),
      };
    } catch (error: any) {
      return {
        success: false,
        message: classifyError(error, context),
      };
    }
  },
};

export const worldWideWebControllerCommandRegistry: TerminalCommand[] = [
  helpCommand,
  clearCommand,
  webControllerStatusCommand,
];
