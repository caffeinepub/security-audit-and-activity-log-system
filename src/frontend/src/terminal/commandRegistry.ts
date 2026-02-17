import type { TerminalCommand } from './types';
import { coreCommands } from './coreCommands';

export class CommandRegistry {
  private commands: Map<string, TerminalCommand> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.registerCoreCommands();
  }

  private registerCoreCommands() {
    coreCommands.forEach(cmd => this.register(cmd));
  }

  register(command: TerminalCommand) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliases.set(alias, command.name);
      });
    }
  }

  get(nameOrAlias: string): TerminalCommand | undefined {
    const actualName = this.aliases.get(nameOrAlias) || nameOrAlias;
    return this.commands.get(actualName);
  }

  getAllCommands(): TerminalCommand[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(): Map<string, TerminalCommand[]> {
    const byCategory = new Map<string, TerminalCommand[]>();
    this.commands.forEach(cmd => {
      const category = cmd.category || 'Other';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(cmd);
    });
    return byCategory;
  }
}

export const commandRegistry = new CommandRegistry();
