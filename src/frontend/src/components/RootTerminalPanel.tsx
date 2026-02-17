import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, ChevronRight } from 'lucide-react';
import { commandRegistry } from '../terminal/commandRegistry';
import type { TerminalHistoryEntry, TerminalContext } from '../terminal/types';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRecordAuditEntry } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { classifyError } from '../terminal/terminalGuards';

export default function RootTerminalPanel() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const recordAuditEntry = useRecordAuditEntry();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([{
        command: '',
        output: {
          success: true,
          message: 'Internet Computer Canister Administration Terminal v1.0.0\nType "help" for available commands.\n',
        },
        timestamp: new Date(),
      }]);
    }
  }, []);

  const executeCommand = async (commandLine: string) => {
    const trimmed = commandLine.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const commandName = parts[0];
    const args = parts.slice(1);

    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const command = commandRegistry.get(commandName);

    if (!command) {
      setHistory(prev => [...prev, {
        command: trimmed,
        output: {
          success: false,
          message: `Command not found: ${commandName}\nType "help" for available commands.`,
        },
        timestamp: new Date(),
      }]);
      return;
    }

    try {
      const context: TerminalContext = {
        actor,
        identity,
        recordAuditEntry: async (entry) => {
          // Best-effort audit recording - never throws
          try {
            if (actor && identity) {
              await recordAuditEntry.mutateAsync(entry);
            }
          } catch (error) {
            // Silently swallow audit recording errors
            console.warn('Audit recording failed:', error);
          }
        },
        queryClient,
      };

      const output = await command.execute(args, context);

      if (output.message === '__CLEAR__') {
        setHistory([]);
        // Restore focus to input after clear
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        setHistory(prev => [...prev, {
          command: trimmed,
          output,
          timestamp: new Date(),
        }]);
        // Restore focus to input after command execution
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    } catch (error: any) {
      const errorMessage = classifyError(error, {
        actor,
        identity,
        recordAuditEntry: async () => {},
        queryClient,
      });

      setHistory(prev => [...prev, {
        command: trimmed,
        output: {
          success: false,
          message: `Error executing command: ${errorMessage}`,
        },
        timestamp: new Date(),
      }]);
      // Restore focus to input after error
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
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

  return (
    <Card className="border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-purple-500" />
          Root Terminal
        </CardTitle>
        <CardDescription>
          Internet Computer canister administration interface for auditing, roles, user management, and broadcast configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-black/90 text-green-400 font-mono text-sm">
          <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
            <div className="space-y-2">
              {history.map((entry, index) => (
                <div key={index}>
                  {entry.command && (
                    <div className="flex items-center gap-2 text-green-400">
                      <ChevronRight className="h-4 w-4" />
                      <span>{entry.command}</span>
                    </div>
                  )}
                  <div className={`ml-6 whitespace-pre-wrap ${entry.output.success ? 'text-green-300' : 'text-red-400'}`}>
                    {entry.output.message}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t border-green-500/30 p-2 flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-green-400" />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="flex-1 bg-transparent border-none text-green-400 placeholder:text-green-600 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use arrow keys (↑/↓) to navigate command history. Type "help" for available commands.
        </p>
      </CardContent>
    </Card>
  );
}
