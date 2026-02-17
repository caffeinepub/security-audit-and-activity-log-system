export interface TerminalCommand {
  name: string;
  aliases?: string[];
  description: string;
  category: string;
  usage?: string;
  execute: (args: string[], context: TerminalContext) => Promise<TerminalOutput>;
}

export interface TerminalContext {
  actor: any;
  identity: any;
  recordAuditEntry: (entry: any) => Promise<void>;
  queryClient: any;
}

export interface TerminalOutput {
  success: boolean;
  message: string;
  data?: any;
}

export interface TerminalHistoryEntry {
  command: string;
  output: TerminalOutput;
  timestamp: Date;
}
