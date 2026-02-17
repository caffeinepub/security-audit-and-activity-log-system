import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRecordAuditEntry } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import type { TerminalCommand, TerminalHistoryEntry, TerminalContext } from '../terminal/types';
import { commandRegistry } from '../terminal/commandRegistry';

interface RootTerminalPanelProps {
  commandRegistry?: TerminalCommand[];
  title?: string;
  description?: string;
}

export default function RootTerminalPanel({
  commandRegistry: customRegistry,
  title = 'Root Terminal',
  description = 'Execute administrative commands for Internet Computer canister operations',
}: RootTerminalPanelProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const recordAuditEntry = useRecordAuditEntry();
  const queryClient = useQueryClient();

  const activeRegistry = customRegistry || commandRegistry;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (commandLine: string) => {
    if (!commandLine.trim()) return;

    setIsExecuting(true);
    const parts = commandLine.trim().split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const context: TerminalContext = {
      actor,
      identity,
      recordAuditEntry: recordAuditEntry.mutateAsync,
      queryClient,
    };

    const command = activeRegistry.find(
      (c) => c.name === cmdName || c.aliases?.includes(cmdName)
    );

    let output;
    if (!command) {
      // Check if this is a restricted command (exists in full registry but not in current registry)
      const fullCommand = commandRegistry.find(
        (c) => c.name === cmdName || c.aliases?.includes(cmdName)
      );

      if (fullCommand && !customRegistry) {
        // This shouldn't happen in normal flow, but handle it
        output = {
          success: false,
          message: `Command not found: ${cmdName}\n\nType "help" to see available commands.`,
        };
      } else if (fullCommand && customRegistry) {
        // Command exists in full registry but not in ICP Controller registry
        output = {
          success: false,
          message: `Access denied: Insufficient privileges to execute "${cmdName}".\n\nThis command requires Security or App Controller role.\nType "help" to see available commands for your role.`,
        };
      } else {
        output = {
          success: false,
          message: `Command not found: ${cmdName}\n\nType "help" to see available commands.`,
        };
      }
    } else {
      try {
        output = await command.execute(args, context);
      } catch (error: any) {
        output = {
          success: false,
          message: `Command execution failed: ${error.message || String(error)}`,
        };
      }
    }

    const entry: TerminalHistoryEntry = {
      command: commandLine,
      output,
      timestamp: new Date(),
    };

    setHistory((prev) => [...prev, entry]);
    setCommandHistory((prev) => [...prev, commandLine]);
    setHistoryIndex(-1);
    setIsExecuting(false);

    // Handle clear command
    if (output.data?.clear) {
      setHistory([]);
    }

    // Restore focus to input after command execution
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isExecuting) {
      executeCommand(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const clearHistory = () => {
    setHistory([]);
    // Restore focus after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/30 p-4" ref={scrollRef}>
          <div className="space-y-3 font-mono text-sm">
            {history.length === 0 && (
              <div className="text-muted-foreground">
                Type "help" to see available commands.
              </div>
            )}
            {history.map((entry, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-primary">$</span>
                  <span className="text-foreground">{entry.command}</span>
                </div>
                <div
                  className={`whitespace-pre-wrap pl-4 ${
                    entry.output.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {entry.output.message}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-md border bg-muted/30 px-3">
            <span className="text-primary font-mono">$</span>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
              disabled={isExecuting}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!input.trim() || isExecuting} size="icon">
            <Send className="h-4 w-4" />
          </Button>
          <Button type="button" onClick={clearHistory} variant="outline" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>

        <div className="text-xs text-muted-foreground">
          <p>• Press ↑/↓ to navigate command history</p>
          <p>• Type "help" for available commands</p>
          <p>• Commands are executed with best-effort audit logging</p>
        </div>
      </CardContent>
    </Card>
  );
}
