import type { TerminalCommand, TerminalOutput } from './types';
import { Principal } from '@icp-sdk/core/principal';
import { T__1, T__2 } from '../backend';
import { tryRecordAuditEntry, appendAuditWarning, classifyError, requiresBackendAndAuth, formatTimestamp, parseSeverity, parseActionType } from './terminalGuards';

export const coreCommands: TerminalCommand[] = [
  {
    name: 'help',
    aliases: ['?', 'man'],
    description: 'Display available commands and usage information',
    category: 'Core',
    usage: 'help [command]',
    execute: async (args, context) => {
      if (args.length > 0) {
        const { commandRegistry } = await import('./commandRegistry');
        const cmd = commandRegistry.get(args[0]);
        if (cmd) {
          return {
            success: true,
            message: `${cmd.name}: ${cmd.description}\n${cmd.usage ? `Usage: ${cmd.usage}` : ''}${cmd.aliases ? `\nAliases: ${cmd.aliases.join(', ')}` : ''}`,
          };
        }
        return { success: false, message: `Command not found: ${args[0]}\nType "help" for available commands.` };
      }

      const { commandRegistry } = await import('./commandRegistry');
      const byCategory = commandRegistry.getCommandsByCategory();
      let output = 'Available Commands:\n\n';
      
      byCategory.forEach((commands, category) => {
        output += `${category}:\n`;
        commands.forEach(cmd => {
          output += `  ${cmd.name.padEnd(25)} - ${cmd.description}\n`;
        });
        output += '\n';
      });

      output += 'Type "help <command>" for detailed information about a specific command.';
      return { success: true, message: output };
    },
  },
  {
    name: 'clear',
    aliases: ['cls'],
    description: 'Clear the terminal screen',
    category: 'Core',
    execute: async () => ({
      success: true,
      message: '__CLEAR__',
    }),
  },
  
  // ===== Security Role Management =====
  {
    name: 'security-grant',
    aliases: ['grant-security'],
    description: 'Grant Security role to a user (App Controller only)',
    category: 'Security',
    usage: 'security-grant <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: security-grant <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.grantSecurityRole(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.permissionChange,
          details: `Terminal command: security-grant ${args[0]}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: ['securityStatus'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `Security role granted successfully to: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.permissionChange,
          details: `Terminal command failed: security-grant ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to grant Security role: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'security-revoke',
    aliases: ['revoke-security'],
    description: 'Revoke Security role from a user (App Controller only)',
    category: 'Security',
    usage: 'security-revoke <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: security-revoke <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.revokeSecurityRole(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.permissionChange,
          details: `Terminal command: security-revoke ${args[0]}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: ['securityStatus'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `Security role revoked successfully from: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.permissionChange,
          details: `Terminal command failed: security-revoke ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to revoke Security role: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'security-status',
    aliases: ['is-security', 'check-security'],
    description: 'Check if current user has Security role',
    category: 'Security',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const isSecurity = await context.actor.isSecurityUser();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: security-status executed',
          success: true,
          severity: T__2.info,
        });

        const status = isSecurity ? 'YES - You have Security role' : 'NO - You do not have Security role';
        return { success: true, message: appendAuditWarning(status, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to check Security status: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'admin-status',
    aliases: ['is-admin', 'check-admin'],
    description: 'Check if current user is an admin',
    category: 'Security',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const isAdmin = await context.actor.isCallerAdmin();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: admin-status executed',
          success: true,
          severity: T__2.info,
        });

        const status = isAdmin ? 'YES - You are an admin' : 'NO - You are not an admin';
        return { success: true, message: appendAuditWarning(status, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to check admin status: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'appcontroller-status',
    aliases: ['is-appcontroller', 'check-appcontroller'],
    description: 'Check if current user is the App Controller',
    category: 'Security',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const isAppController = await context.actor.getCallerAppControllerStatus();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: appcontroller-status executed',
          success: true,
          severity: T__2.info,
        });

        const status = isAppController ? 'YES - You are the App Controller' : 'NO - You are not the App Controller';
        return { success: true, message: appendAuditWarning(status, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to check App Controller status: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'appcontroller-check',
    aliases: ['check-appcontroller-user'],
    description: 'Check if a specific user is the App Controller',
    category: 'Security',
    usage: 'appcontroller-check <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: appcontroller-check <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        const isAppController = await context.actor.isAppController(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: `Terminal command: appcontroller-check ${args[0]}`,
          success: true,
          severity: T__2.info,
        });

        const status = isAppController 
          ? `YES - ${args[0]} is the App Controller` 
          : `NO - ${args[0]} is not the App Controller`;
        return { success: true, message: appendAuditWarning(status, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to check App Controller status: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== Audit Log Operations =====
  {
    name: 'audit-list',
    aliases: ['list-audit', 'audit-logs'],
    description: 'List audit log entries with optional filters',
    category: 'Audit',
    usage: 'audit-list [--from=<timestamp>] [--to=<timestamp>] [--user=<principal>] [--action=<type>] [--severity=<level>]',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const filter: any = {};
        
        args.forEach(arg => {
          if (arg.startsWith('--from=')) {
            filter.fromDate = BigInt(arg.substring(7));
          } else if (arg.startsWith('--to=')) {
            filter.toDate = BigInt(arg.substring(5));
          } else if (arg.startsWith('--user=')) {
            filter.user = Principal.fromText(arg.substring(7));
          } else if (arg.startsWith('--action=')) {
            filter.actionType = parseActionType(arg.substring(9));
          } else if (arg.startsWith('--severity=')) {
            filter.severity = parseSeverity(arg.substring(11));
          }
        });

        const logs = await context.actor.getAuditLogs(filter);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: `Terminal command: audit-list executed with ${logs.length} results`,
          success: true,
          severity: T__2.info,
        });

        if (logs.length === 0) {
          return { success: true, message: appendAuditWarning('No audit log entries found matching the criteria.', auditWarning) };
        }

        let output = `Found ${logs.length} audit log entries:\n\n`;
        logs.slice(0, 20).forEach((entry, index) => {
          output += `[${index + 1}] ${formatTimestamp(entry.timestamp)} | ${entry.user.toString().substring(0, 20)}... | ${entry.actionType} | ${entry.severity}\n`;
          output += `    ${entry.details}\n`;
        });

        if (logs.length > 20) {
          output += `\n... and ${logs.length - 20} more entries (use filters to narrow results)`;
        }

        return { success: true, message: appendAuditWarning(output, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to list audit logs: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'audit-record',
    aliases: ['record-audit'],
    description: 'Record a new audit log entry',
    category: 'Audit',
    usage: 'audit-record --action=<type> --details="<text>" [--severity=<level>] [--success=<true|false>]',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      let actionType: T__1 | undefined;
      let details: string | undefined;
      let severity: T__2 = T__2.info;
      let success: boolean | undefined;

      args.forEach(arg => {
        if (arg.startsWith('--action=')) {
          actionType = parseActionType(arg.substring(9));
        } else if (arg.startsWith('--details=')) {
          details = arg.substring(10).replace(/^["']|["']$/g, '');
        } else if (arg.startsWith('--severity=')) {
          severity = parseSeverity(arg.substring(11));
        } else if (arg.startsWith('--success=')) {
          success = arg.substring(10) === 'true';
        }
      });

      if (!actionType || !details) {
        return { success: false, message: 'Usage: audit-record --action=<type> --details="<text>" [--severity=<level>] [--success=<true|false>]' };
      }

      try {
        await context.actor.recordAuditEntry({
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          user: context.identity!.getPrincipal(),
          actionType,
          details,
          ipAddress: undefined,
          deviceInfo: undefined,
          sessionData: undefined,
          success,
          severity,
        });

        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        return { success: true, message: 'Audit entry recorded successfully.' };
      } catch (error: any) {
        return { success: false, message: `Failed to record audit entry: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'audit-export',
    aliases: ['export-audit'],
    description: 'Export complete audit log to JSON',
    category: 'Audit',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const logs = await context.actor.exportAuditLogToJson();
        
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        return { 
          success: true, 
          message: `Audit log exported successfully. Total entries: ${logs.length}\nNote: Full JSON export is available via the Superuser Audit Panel in the dashboard.` 
        };
      } catch (error: any) {
        return { success: false, message: `Failed to export audit log: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== User Profile Operations =====
  {
    name: 'profile-get',
    aliases: ['get-profile', 'whoami'],
    description: 'Get current user profile',
    category: 'User Management',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const profile = await context.actor.getCallerUserProfile();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: profile-get executed',
          success: true,
          severity: T__2.info,
        });

        if (!profile) {
          return { success: true, message: appendAuditWarning('No profile found. Use "profile-set-name" to create one.', auditWarning) };
        }

        const output = `User Profile:\nName: ${profile.name}\nPrincipal: ${context.identity!.getPrincipal().toString()}`;
        return { success: true, message: appendAuditWarning(output, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to get profile: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'profile-set-name',
    aliases: ['set-name'],
    description: 'Set user profile name',
    category: 'User Management',
    usage: 'profile-set-name <name>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: profile-set-name <name>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const name = args.join(' ');
        await context.actor.saveCallerUserProfile({ name });
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command: profile-set-name to "${name}"`,
          success: true,
          severity: T__2.info,
        });

        context.queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });

        const message = `Profile name set successfully to: ${name}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command failed: profile-set-name - ${error.message}`,
          success: false,
          severity: T__2.warning,
        });
        return { success: false, message: `Failed to set profile name: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== User Management Operations =====
  {
    name: 'user-flag',
    aliases: ['flag-user'],
    description: 'Flag a user as suspicious',
    category: 'User Management',
    usage: 'user-flag <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: user-flag <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.flagUser(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command: user-flag ${args[0]}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `User flagged successfully: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command failed: user-flag ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to flag user: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'user-unflag',
    aliases: ['unflag-user'],
    description: 'Remove suspicious flag from a user',
    category: 'User Management',
    usage: 'user-unflag <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: user-unflag <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.unflagUser(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command: user-unflag ${args[0]}`,
          success: true,
          severity: T__2.info,
        });

        context.queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `User unflagged successfully: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command failed: user-unflag ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.warning,
        });
        return { success: false, message: `Failed to unflag user: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'user-remove',
    aliases: ['remove-user'],
    description: 'Remove a user account',
    category: 'User Management',
    usage: 'user-remove <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: user-remove <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.removeUser(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command: user-remove ${args[0]}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `User removed successfully: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.accountChange,
          details: `Terminal command failed: user-remove ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to remove user: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'user-list-flagged',
    aliases: ['list-flagged', 'flagged-users'],
    description: 'List all flagged users',
    category: 'User Management',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const flaggedUsers = await context.actor.getFlaggedUsers();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: `Terminal command: user-list-flagged executed with ${flaggedUsers.length} results`,
          success: true,
          severity: T__2.info,
        });

        if (flaggedUsers.length === 0) {
          return { success: true, message: appendAuditWarning('No flagged users found.', auditWarning) };
        }

        let output = `Found ${flaggedUsers.length} flagged users:\n\n`;
        flaggedUsers.forEach((principal, index) => {
          output += `[${index + 1}] ${principal.toString()}\n`;
        });

        return { success: true, message: appendAuditWarning(output, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to list flagged users: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== Broadcasting Configuration =====
  {
    name: 'broadcast-config',
    aliases: ['config-broadcast'],
    description: 'Configure external broadcasting settings',
    category: 'Broadcasting',
    usage: 'broadcast-config --enabled=<true|false> [--endpoint=<url>]',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      let enabled: boolean | undefined;
      let endpoint: string | null = null;

      args.forEach(arg => {
        if (arg.startsWith('--enabled=')) {
          enabled = arg.substring(10) === 'true';
        } else if (arg.startsWith('--endpoint=')) {
          endpoint = arg.substring(11);
        }
      });

      if (enabled === undefined) {
        return { success: false, message: 'Usage: broadcast-config --enabled=<true|false> [--endpoint=<url>]' };
      }

      try {
        await context.actor.configureExternalBroadcasting(enabled, endpoint);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.configUpload,
          details: `Terminal command: broadcast-config enabled=${enabled} endpoint=${endpoint || 'none'}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: ['broadcastSettings'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `Broadcasting configuration updated successfully.\nEnabled: ${enabled}\nEndpoint: ${endpoint || 'none'}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.configUpload,
          details: `Terminal command failed: broadcast-config - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to configure broadcasting: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'broadcast-status',
    aliases: ['status-broadcast'],
    description: 'Get current broadcasting configuration',
    category: 'Broadcasting',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const settings = await context.actor.getExternalBroadcastingSettings();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: broadcast-status executed',
          success: true,
          severity: T__2.info,
        });

        const output = `Broadcasting Configuration:\nEnabled: ${settings.enabled}\nEndpoint: ${settings.endpointUrl || 'none'}`;
        return { success: true, message: appendAuditWarning(output, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to get broadcasting status: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== Local-only Diagnostic Commands =====
  {
    name: 'now',
    description: 'Display current timestamp (local diagnostic)',
    category: 'Diagnostics',
    execute: async () => {
      const now = Date.now();
      const date = new Date(now);
      return {
        success: true,
        message: `Current timestamp: ${now}\nFormatted: ${date.toISOString()}\nLocal: ${date.toLocaleString()}`,
      };
    },
  },
  {
    name: 'echo',
    description: 'Echo back the provided arguments (local diagnostic)',
    category: 'Diagnostics',
    usage: 'echo <text>',
    execute: async (args) => {
      return {
        success: true,
        message: args.join(' ') || '(empty)',
      };
    },
  },
  {
    name: 'terminal-status',
    aliases: ['status'],
    description: 'Display terminal connection status (local diagnostic)',
    category: 'Diagnostics',
    execute: async (args, context) => {
      const hasActor = !!context.actor;
      const hasIdentity = !!context.identity;
      const principal = hasIdentity ? context.identity!.getPrincipal().toString() : 'Not authenticated';

      return {
        success: true,
        message: `Terminal Status:\nBackend Connected: ${hasActor ? 'YES' : 'NO'}\nAuthenticated: ${hasIdentity ? 'YES' : 'NO'}\nPrincipal: ${principal}\n\nNote: This is a local diagnostic command. Use ICP Connection Status panel for detailed connection diagnostics.`,
      };
    },
  },
];
