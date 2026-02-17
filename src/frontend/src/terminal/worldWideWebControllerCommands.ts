import type { TerminalCommand, TerminalContext, TerminalOutput } from './types';
import { executeWithAudit, executeLocalCommand } from './webControlAudit';
import { requiresBackendAndAuth } from './terminalGuards';
import { generateCatalogCommands, getCommandStats } from './webControlCommandCatalog';

/**
 * World Wide Web Controller-safe command registry.
 * Includes 200+ safe commands for diagnostics, operations, and self-service.
 */

const helpCommand: TerminalCommand = {
  name: 'help',
  aliases: ['?', 'h'],
  description: 'Display available commands',
  category: 'General',
  usage: 'help [command] or help [category]',
  execute: async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    return executeLocalCommand(context, 'help', async () => {
      if (args.length > 0) {
        const query = args[0].toLowerCase();
        
        // Check if it's a specific command
        const cmd = worldWideWebControllerCommandRegistry.find(
          (c) => c.name === query || c.aliases?.includes(query)
        );
        if (cmd) {
          return {
            success: true,
            message: `Command: ${cmd.name}\nDescription: ${cmd.description}\nUsage: ${cmd.usage || cmd.name}\nCategory: ${cmd.category}${cmd.aliases ? `\nAliases: ${cmd.aliases.join(', ')}` : ''}`,
          };
        }
        
        // Check if it's a category
        const categoryCommands = worldWideWebControllerCommandRegistry.filter(
          (c) => c.category.toLowerCase() === query
        );
        if (categoryCommands.length > 0) {
          let output = `Commands in category "${categoryCommands[0].category}":\n\n`;
          categoryCommands.forEach((cmd) => {
            const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
            output += `  ${cmd.name}${aliases} - ${cmd.description}\n`;
          });
          return { success: true, message: output };
        }
        
        return {
          success: false,
          message: `Command or category not found: ${query}`,
        };
      }

      // Show summary with command counts
      const stats = getCommandStats();
      const totalCommands = worldWideWebControllerCommandRegistry.length;
      
      let output = `Web Control Terminal - ${totalCommands} commands available\n\n`;
      output += 'Command Categories:\n\n';
      
      const categories = Array.from(new Set(worldWideWebControllerCommandRegistry.map((c) => c.category)));
      categories.forEach((category) => {
        const count = worldWideWebControllerCommandRegistry.filter((c) => c.category === category).length;
        output += `  ${category} (${count} commands)\n`;
      });
      
      output += '\nUsage:\n';
      output += '  help <command>  - Show detailed help for a specific command\n';
      output += '  help <category> - List all commands in a category\n\n';
      output += 'Examples:\n';
      output += '  help diag-connection-status\n';
      output += '  help diagnostics\n';
      output += '  help operations\n';

      return { success: true, message: output };
    });
  },
};

const clearCommand: TerminalCommand = {
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear the terminal screen',
  category: 'General',
  execute: async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    return executeLocalCommand(context, 'clear', async () => {
      return { success: true, message: '', data: { clear: true } };
    });
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

    return executeWithAudit(
      context,
      'World Wide Web Controller status check via terminal',
      async () => {
        const hasRole = await context.actor.hasWorldWideWebControllerRole();
        const principal = context.identity.getPrincipal().toString();

        return {
          success: true,
          message: `Principal: ${principal}\nWorld Wide Web Controller Role: ${hasRole ? 'Yes' : 'No'}\n\nYou have access to ${worldWideWebControllerCommandRegistry.length} safe Web Control commands.`,
        };
      }
    );
  },
};

// Generate all catalog commands
const catalogCommands = generateCatalogCommands();

// Export the complete registry
export const worldWideWebControllerCommandRegistry: TerminalCommand[] = [
  helpCommand,
  clearCommand,
  webControllerStatusCommand,
  ...catalogCommands,
];
