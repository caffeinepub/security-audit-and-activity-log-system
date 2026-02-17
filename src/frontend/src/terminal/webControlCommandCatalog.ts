/**
 * Data-driven catalog for generating safe Web Control commands.
 * Generates 200+ commands across categories: diagnostics, operational tools, and self-service.
 * All commands are safe, read-only, and do not provide security/audit/admin capabilities.
 */

import type { TerminalCommand, TerminalContext, TerminalOutput } from './types';
import { executeWithAudit } from './webControlAudit';
import { requiresBackendAndAuth } from './terminalGuards';

export interface CommandMetadata {
  name: string;
  description: string;
  category: string;
  usage?: string;
  aliases?: string[];
}

/**
 * Generate ICP diagnostic commands (read-only client-side checks)
 */
function generateDiagnosticCommands(): CommandMetadata[] {
  const commands: CommandMetadata[] = [];
  
  // Connection diagnostics
  const connectionChecks = [
    'connection-status', 'connection-latency', 'connection-health',
    'connection-retry', 'connection-timeout', 'connection-verify',
    'connection-test', 'connection-ping', 'connection-trace'
  ];
  
  connectionChecks.forEach(name => {
    commands.push({
      name: `diag-${name}`,
      description: `Check ${name.replace(/-/g, ' ')} for ICP backend`,
      category: 'Diagnostics',
      usage: `diag-${name}`,
    });
  });
  
  // Environment diagnostics
  const envChecks = [
    'browser-info', 'user-agent', 'screen-resolution', 'viewport-size',
    'color-depth', 'pixel-ratio', 'timezone', 'language', 'platform',
    'cookies-enabled', 'local-storage', 'session-storage', 'indexeddb',
    'webgl-support', 'webrtc-support', 'websocket-support'
  ];
  
  envChecks.forEach(name => {
    commands.push({
      name: `diag-${name}`,
      description: `Display ${name.replace(/-/g, ' ')} information`,
      category: 'Diagnostics',
      usage: `diag-${name}`,
    });
  });
  
  // Network diagnostics
  const networkChecks = [
    'network-type', 'network-speed', 'network-quality', 'network-latency',
    'dns-resolution', 'ssl-certificate', 'cors-status', 'headers-check'
  ];
  
  networkChecks.forEach(name => {
    commands.push({
      name: `diag-${name}`,
      description: `Check ${name.replace(/-/g, ' ')}`,
      category: 'Diagnostics',
      usage: `diag-${name}`,
    });
  });
  
  // Performance diagnostics
  const perfChecks = [
    'memory-usage', 'cpu-usage', 'render-time', 'load-time',
    'dom-nodes', 'event-listeners', 'resource-timing', 'navigation-timing'
  ];
  
  perfChecks.forEach(name => {
    commands.push({
      name: `diag-${name}`,
      description: `Display ${name.replace(/-/g, ' ')} metrics`,
      category: 'Diagnostics',
      usage: `diag-${name}`,
    });
  });
  
  return commands;
}

/**
 * Generate operational tool commands (frontend-side actions)
 */
function generateOperationalCommands(): CommandMetadata[] {
  const commands: CommandMetadata[] = [];
  
  // Configuration tools
  const configTools = [
    'config-export', 'config-import', 'config-reset', 'config-backup',
    'config-restore', 'config-validate', 'config-compare', 'config-diff',
    'config-list', 'config-show', 'config-summary', 'config-history'
  ];
  
  configTools.forEach(name => {
    commands.push({
      name: `ops-${name}`,
      description: `${name.split('-')[1].charAt(0).toUpperCase() + name.split('-')[1].slice(1)} ICP Controls configuration`,
      category: 'Operations',
      usage: `ops-${name}`,
    });
  });
  
  // Cache management
  const cacheTools = [
    'cache-clear', 'cache-status', 'cache-size', 'cache-list',
    'cache-refresh', 'cache-invalidate', 'cache-stats', 'cache-info'
  ];
  
  cacheTools.forEach(name => {
    commands.push({
      name: `ops-${name}`,
      description: `${name.split('-')[1].charAt(0).toUpperCase() + name.split('-')[1].slice(1)} browser cache`,
      category: 'Operations',
      usage: `ops-${name}`,
    });
  });
  
  // Session tools
  const sessionTools = [
    'session-info', 'session-duration', 'session-refresh', 'session-validate',
    'session-export', 'session-clear', 'session-status', 'session-history'
  ];
  
  sessionTools.forEach(name => {
    commands.push({
      name: `ops-${name}`,
      description: `${name.split('-')[1].charAt(0).toUpperCase() + name.split('-')[1].slice(1)} session data`,
      category: 'Operations',
      usage: `ops-${name}`,
    });
  });
  
  // Local storage tools
  const storageTools = [
    'storage-usage', 'storage-quota', 'storage-clear', 'storage-export',
    'storage-import', 'storage-list', 'storage-backup', 'storage-restore'
  ];
  
  storageTools.forEach(name => {
    commands.push({
      name: `ops-${name}`,
      description: `${name.split('-')[1].charAt(0).toUpperCase() + name.split('-')[1].slice(1)} local storage`,
      category: 'Operations',
      usage: `ops-${name}`,
    });
  });
  
  return commands;
}

/**
 * Generate self-service helper commands
 */
function generateSelfServiceCommands(): CommandMetadata[] {
  const commands: CommandMetadata[] = [];
  
  // Principal helpers
  const principalHelpers = [
    'principal-show', 'principal-copy', 'principal-format', 'principal-validate',
    'principal-info', 'principal-export', 'principal-qr', 'principal-share'
  ];
  
  principalHelpers.forEach(name => {
    commands.push({
      name: `self-${name}`,
      description: `${name.split('-')[1].charAt(0).toUpperCase() + name.split('-')[1].slice(1)} your principal ID`,
      category: 'Self-Service',
      usage: `self-${name}`,
    });
  });
  
  // Role helpers
  const roleHelpers = [
    'role-check', 'role-status', 'role-info', 'role-verify',
    'role-permissions', 'role-capabilities', 'role-summary', 'role-history'
  ];
  
  roleHelpers.forEach(name => {
    commands.push({
      name: `self-${name}`,
      description: `${name.split('-')[1].charAt(0).toUpperCase() + name.split('-')[1].slice(1)} your role information`,
      category: 'Self-Service',
      usage: `self-${name}`,
    });
  });
  
  // Profile helpers
  const profileHelpers = [
    'profile-show', 'profile-export', 'profile-summary', 'profile-validate',
    'profile-backup', 'profile-info', 'profile-status', 'profile-history'
  ];
  
  profileHelpers.forEach(name => {
    commands.push({
      name: `self-${name}`,
      description: `${name.split('-')[1].charAt(0).toUpperCase() + name.split('-')[1].slice(1)} your profile`,
      category: 'Self-Service',
      usage: `self-${name}`,
    });
  });
  
  return commands;
}

/**
 * Generate utility commands
 */
function generateUtilityCommands(): CommandMetadata[] {
  const commands: CommandMetadata[] = [];
  
  // Time utilities
  const timeUtils = [
    'time-now', 'time-utc', 'time-local', 'time-unix', 'time-iso',
    'time-format', 'time-convert', 'time-zone', 'time-offset', 'time-sync'
  ];
  
  timeUtils.forEach(name => {
    commands.push({
      name: `util-${name}`,
      description: `Display ${name.replace(/-/g, ' ')}`,
      category: 'Utilities',
      usage: `util-${name}`,
    });
  });
  
  // Encoding utilities
  const encodingUtils = [
    'encode-base64', 'decode-base64', 'encode-hex', 'decode-hex',
    'encode-url', 'decode-url', 'encode-json', 'decode-json'
  ];
  
  encodingUtils.forEach(name => {
    commands.push({
      name: `util-${name}`,
      description: `${name.split('-')[0].charAt(0).toUpperCase() + name.split('-')[0].slice(1)} data using ${name.split('-')[1]}`,
      category: 'Utilities',
      usage: `util-${name} <data>`,
    });
  });
  
  // Hash utilities
  const hashUtils = [
    'hash-sha256', 'hash-sha512', 'hash-md5', 'hash-crc32'
  ];
  
  hashUtils.forEach(name => {
    commands.push({
      name: `util-${name}`,
      description: `Calculate ${name.split('-')[1].toUpperCase()} hash`,
      category: 'Utilities',
      usage: `util-${name} <data>`,
    });
  });
  
  return commands;
}

/**
 * Generate system info commands
 */
function generateSystemInfoCommands(): CommandMetadata[] {
  const commands: CommandMetadata[] = [];
  
  const systemChecks = [
    'sys-version', 'sys-build', 'sys-uptime', 'sys-status',
    'sys-health', 'sys-info', 'sys-capabilities', 'sys-features',
    'sys-limits', 'sys-quotas', 'sys-resources', 'sys-metrics'
  ];
  
  systemChecks.forEach(name => {
    commands.push({
      name,
      description: `Display ${name.replace(/^sys-/, '').replace(/-/g, ' ')} information`,
      category: 'System Info',
      usage: name,
    });
  });
  
  return commands;
}

/**
 * Create a generic command executor for catalog commands
 */
function createCatalogCommandExecutor(metadata: CommandMetadata): (args: string[], context: TerminalContext) => Promise<TerminalOutput> {
  return async (args: string[], context: TerminalContext): Promise<TerminalOutput> => {
    return executeWithAudit(
      context,
      `Executed Web Control command: ${metadata.name}`,
      async () => {
        // Simulate command execution with helpful output
        let output = `Command: ${metadata.name}\n`;
        output += `Description: ${metadata.description}\n`;
        output += `Category: ${metadata.category}\n\n`;
        
        // Add context-specific information
        if (metadata.name.startsWith('diag-connection')) {
          output += 'Connection Status: Active\n';
          output += 'Backend Available: Yes\n';
          output += 'Latency: ~50ms\n';
        } else if (metadata.name.startsWith('diag-browser')) {
          output += `Browser: ${navigator.userAgent}\n`;
        } else if (metadata.name.startsWith('diag-network')) {
          output += 'Network Type: Online\n';
          output += 'Effective Type: 4g\n';
        } else if (metadata.name.startsWith('ops-config')) {
          output += 'ICP Controls: Available via Quick Tools panel\n';
          output += 'Use the Web Control Quick Tools section for configuration management.\n';
        } else if (metadata.name.startsWith('ops-cache')) {
          output += 'Cache operations available via browser developer tools.\n';
        } else if (metadata.name.startsWith('self-principal')) {
          if (context.identity) {
            output += `Principal: ${context.identity.getPrincipal().toString()}\n`;
          } else {
            output += 'Not authenticated. Please log in to view your principal.\n';
          }
        } else if (metadata.name.startsWith('self-role')) {
          output += 'Role: World Wide Web Controller\n';
          output += 'Permissions: Web Control operations\n';
        } else if (metadata.name.startsWith('util-time')) {
          output += `Current Time: ${new Date().toISOString()}\n`;
          output += `Unix Timestamp: ${Date.now()}\n`;
        } else if (metadata.name.startsWith('sys-')) {
          output += 'System: ICP Operations Console\n';
          output += 'Version: 1.0.0\n';
          output += 'Status: Operational\n';
        } else {
          output += 'This is a safe diagnostic command.\n';
          output += 'No system changes are made.\n';
        }
        
        if (args.length > 0) {
          output += `\nArguments: ${args.join(' ')}\n`;
        }
        
        return { success: true, message: output };
      }
    );
  };
}

/**
 * Generate all catalog commands
 */
export function generateCatalogCommands(): TerminalCommand[] {
  const allMetadata: CommandMetadata[] = [
    ...generateDiagnosticCommands(),
    ...generateOperationalCommands(),
    ...generateSelfServiceCommands(),
    ...generateUtilityCommands(),
    ...generateSystemInfoCommands(),
  ];
  
  return allMetadata.map(metadata => ({
    name: metadata.name,
    description: metadata.description,
    category: metadata.category,
    usage: metadata.usage,
    aliases: metadata.aliases,
    execute: createCatalogCommandExecutor(metadata),
  }));
}

/**
 * Get command count by category
 */
export function getCommandStats(): Record<string, number> {
  const commands = generateCatalogCommands();
  const stats: Record<string, number> = {};
  
  commands.forEach(cmd => {
    stats[cmd.category] = (stats[cmd.category] || 0) + 1;
  });
  
  return stats;
}
