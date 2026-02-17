import type { TerminalCommand, TerminalContext, TerminalOutput } from './types';
import { tryRecordAuditEntry, appendAuditWarning, classifyError, requiresBackendAndAuth } from './terminalGuards';
import { T__1, T__2 } from '../backend';

/**
 * ICP Controller-safe command registry.
 * Only includes commands that are safe for ICP Controller role:
 * - help, clear (local)
 * - profile commands (profile-get, whoami, profile-set-name)
 * - Optional: connectivity/role self-check commands
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
      const cmd = icpControllerCommandRegistry.find(
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

    const categories = Array.from(new Set(icpControllerCommandRegistry.map((c) => c.category)));
    let output = 'Available Commands:\n\n';

    categories.forEach((category) => {
      output += `${category}:\n`;
      const cmds = icpControllerCommandRegistry.filter((c) => c.category === category);
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

const profileGetCommand: TerminalCommand = {
  name: 'profile-get',
  aliases: ['whoami'],
  description: 'Display your user profile',
  category: 'Profile',
  execute: async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    const authCheck = requiresBackendAndAuth(context);
    if (authCheck) {
      return { success: false, message: authCheck };
    }

    try {
      const profile = await context.actor.getCallerUserProfile();
      const principal = context.identity.getPrincipal().toString();

      if (!profile) {
        return {
          success: true,
          message: `Principal: ${principal}\nProfile: Not set\n\nUse "profile-set-name <name>" to set your profile name.`,
        };
      }

      return {
        success: true,
        message: `Principal: ${principal}\nName: ${profile.name}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: classifyError(error, context),
      };
    }
  },
};

const profileSetNameCommand: TerminalCommand = {
  name: 'profile-set-name',
  description: 'Set your profile name',
  category: 'Profile',
  usage: 'profile-set-name <name>',
  execute: async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    const authCheck = requiresBackendAndAuth(context);
    if (authCheck) {
      return { success: false, message: authCheck };
    }

    if (args.length === 0) {
      return {
        success: false,
        message: 'Usage: profile-set-name <name>\n\nExample: profile-set-name "John Doe"',
      };
    }

    const name = args.join(' ');

    try {
      await context.actor.saveCallerUserProfile({ name });

      const auditWarning = await tryRecordAuditEntry(context, {
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        actionType: T__1.accountChange,
        details: `Profile name updated via terminal to: ${name}`,
        ipAddress: undefined,
        deviceInfo: undefined,
        sessionData: undefined,
        success: true,
        severity: T__2.info,
      });

      await context.queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });

      return {
        success: true,
        message: appendAuditWarning(`Profile name set to: ${name}`, auditWarning),
      };
    } catch (error: any) {
      return {
        success: false,
        message: classifyError(error, context),
      };
    }
  },
};

const icpControllerStatusCommand: TerminalCommand = {
  name: 'icp-controller-status',
  description: 'Check your ICP Controller role status',
  category: 'ICP Operations',
  execute: async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    const authCheck = requiresBackendAndAuth(context);
    if (authCheck) {
      return { success: false, message: authCheck };
    }

    try {
      const hasRole = await context.actor.hasIcpControllerRole();
      const principal = context.identity.getPrincipal().toString();

      return {
        success: true,
        message: `Principal: ${principal}\nICP Controller Role: ${hasRole ? 'Yes' : 'No'}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: classifyError(error, context),
      };
    }
  },
};

export const icpControllerCommandRegistry: TerminalCommand[] = [
  helpCommand,
  clearCommand,
  profileGetCommand,
  profileSetNameCommand,
  icpControllerStatusCommand,
];
