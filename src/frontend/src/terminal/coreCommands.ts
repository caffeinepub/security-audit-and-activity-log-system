import type { TerminalCommand, TerminalOutput } from './types';
import { Principal } from '@icp-sdk/core/principal';
import { T__1, T__2 } from '../backend';
import { tryRecordAuditEntry, appendAuditWarning, classifyError, requiresBackendAndAuth, formatTimestamp, parseSeverity, parseActionType } from './terminalGuards';
import { icpControllerStatusKey, icpControllersKey, securityStatusKey, worldWideWebControllerStatusKey, worldWideWebControllersKey } from '../queryKeys';

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
        const cmdName = args[0].toLowerCase();
        const cmd = commandRegistry.find(
          (c) => c.name === cmdName || c.aliases?.includes(cmdName)
        );
        if (cmd) {
          return {
            success: true,
            message: `${cmd.name}: ${cmd.description}\n${cmd.usage ? `Usage: ${cmd.usage}` : ''}${cmd.aliases ? `\nAliases: ${cmd.aliases.join(', ')}` : ''}`,
          };
        }
        return { success: false, message: `Command not found: ${args[0]}\nType "help" for available commands.` };
      }

      const { commandRegistry } = await import('./commandRegistry');
      const categories = Array.from(new Set(commandRegistry.map((c) => c.category)));
      let output = 'Available Commands:\n\n';
      
      categories.forEach((category) => {
        output += `${category}:\n`;
        const commands = commandRegistry.filter((c) => c.category === category);
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

        context.queryClient.invalidateQueries({ queryKey: securityStatusKey(args[0]) });
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

        context.queryClient.invalidateQueries({ queryKey: securityStatusKey(args[0]) });
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

  // ===== ICP Controller Role Management =====
  {
    name: 'icp-controller-list',
    aliases: ['list-icp-controllers'],
    description: 'List all ICP Controllers (App Controller only)',
    category: 'ICP Controller',
    usage: 'icp-controller-list',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const controllers = await context.actor.listIcpControllers(false);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: icp-controller-list executed',
          success: true,
          severity: T__2.info,
        });

        if (controllers.length === 0) {
          return { success: true, message: appendAuditWarning('No ICP Controllers have been assigned yet.', auditWarning) };
        }

        let output = `ICP Controllers (${controllers.length}):\n\n`;
        controllers.forEach((controller, index) => {
          output += `${index + 1}. Principal: ${controller.principal.toString()}\n`;
          if (controller.name) {
            output += `   Name: ${controller.name}\n`;
          }
          if (controller.description) {
            output += `   Description: ${controller.description}\n`;
          }
          output += `   Status: ${controller.roleAssigned ? 'Active' : 'Revoked'}\n`;
          output += '\n';
        });

        return { success: true, message: appendAuditWarning(output.trim(), auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: `Terminal command failed: icp-controller-list - ${error.message}`,
          success: false,
          severity: T__2.warning,
        });
        return { success: false, message: `Failed to list ICP Controllers: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'icp-controller-grant',
    aliases: ['grant-icp-controller'],
    description: 'Grant ICP Controller role to a user (App Controller only)',
    category: 'ICP Controller',
    usage: 'icp-controller-grant <principal> [name] [description]',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: icp-controller-grant <principal> [name] [description]' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        const name = args[1] || null;
        const description = args.slice(2).join(' ') || null;
        
        await context.actor.grantIcpControllerRole(principal, name, description);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.superuserPrivilegeChange,
          details: `Terminal command: icp-controller-grant ${args[0]}${name ? ` (${name})` : ''}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: icpControllersKey(false) });
        context.queryClient.invalidateQueries({ queryKey: icpControllersKey(true) });
        context.queryClient.invalidateQueries({ queryKey: icpControllerStatusKey(args[0]) });
        context.queryClient.invalidateQueries({ queryKey: ['icpControllerStatus'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `ICP Controller role granted successfully to: ${args[0]}${name ? ` (${name})` : ''}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.superuserPrivilegeChange,
          details: `Terminal command failed: icp-controller-grant ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to grant ICP Controller role: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'icp-controller-revoke',
    aliases: ['revoke-icp-controller'],
    description: 'Revoke ICP Controller role from a user (App Controller only)',
    category: 'ICP Controller',
    usage: 'icp-controller-revoke <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: icp-controller-revoke <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.revokeIcpControllerRole(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.superuserPrivilegeChange,
          details: `Terminal command: icp-controller-revoke ${args[0]}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: icpControllersKey(false) });
        context.queryClient.invalidateQueries({ queryKey: icpControllersKey(true) });
        context.queryClient.invalidateQueries({ queryKey: icpControllerStatusKey(args[0]) });
        context.queryClient.invalidateQueries({ queryKey: ['icpControllerStatus'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `ICP Controller role revoked successfully from: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.superuserPrivilegeChange,
          details: `Terminal command failed: icp-controller-revoke ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to revoke ICP Controller role: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'icp-controller-status',
    aliases: ['is-icp-controller', 'check-icp-controller'],
    description: 'Check if current user has ICP Controller role',
    category: 'ICP Controller',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const hasRole = await context.actor.hasIcpControllerRole();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: icp-controller-status executed',
          success: true,
          severity: T__2.info,
        });

        const status = hasRole ? 'YES - You have ICP Controller role' : 'NO - You do not have ICP Controller role';
        return { success: true, message: appendAuditWarning(status, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to check ICP Controller status: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== World Wide Web Controller Role Management =====
  {
    name: 'www-controller-list',
    aliases: ['list-www-controllers', 'web-control-list'],
    description: 'List all World Wide Web Controllers (App Controller only)',
    category: 'World Wide Web Controller',
    usage: 'www-controller-list',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const controllers = await context.actor.getAllWorldWideWebControllers();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: www-controller-list executed',
          success: true,
          severity: T__2.info,
        });

        if (controllers.length === 0) {
          return { success: true, message: appendAuditWarning('No World Wide Web Controllers have been assigned yet.', auditWarning) };
        }

        let output = `World Wide Web Controllers (${controllers.length}):\n\n`;
        controllers.forEach((controller, index) => {
          output += `${index + 1}. Principal: ${controller.toString()}\n`;
        });

        return { success: true, message: appendAuditWarning(output.trim(), auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: `Terminal command failed: www-controller-list - ${error.message}`,
          success: false,
          severity: T__2.warning,
        });
        return { success: false, message: `Failed to list World Wide Web Controllers: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'www-controller-grant',
    aliases: ['grant-www-controller', 'web-control-grant'],
    description: 'Grant World Wide Web Controller role to a user (App Controller only)',
    category: 'World Wide Web Controller',
    usage: 'www-controller-grant <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: www-controller-grant <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.grantWorldWideWebControllerRole(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.worldWideWebControllerPrivilegeChange,
          details: `Terminal command: www-controller-grant ${args[0]}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: worldWideWebControllersKey() });
        context.queryClient.invalidateQueries({ queryKey: worldWideWebControllerStatusKey(args[0]) });
        context.queryClient.invalidateQueries({ queryKey: ['worldWideWebControllerStatus'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `World Wide Web Controller role granted successfully to: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.worldWideWebControllerPrivilegeChange,
          details: `Terminal command failed: www-controller-grant ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to grant World Wide Web Controller role: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'www-controller-revoke',
    aliases: ['revoke-www-controller', 'web-control-revoke'],
    description: 'Revoke World Wide Web Controller role from a user (App Controller only)',
    category: 'World Wide Web Controller',
    usage: 'www-controller-revoke <principal>',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: www-controller-revoke <principal>' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const principal = Principal.fromText(args[0]);
        await context.actor.revokeWorldWideWebControllerRole(principal);
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.worldWideWebControllerPrivilegeChange,
          details: `Terminal command: www-controller-revoke ${args[0]}`,
          success: true,
          severity: T__2.warning,
        });

        context.queryClient.invalidateQueries({ queryKey: worldWideWebControllersKey() });
        context.queryClient.invalidateQueries({ queryKey: worldWideWebControllerStatusKey(args[0]) });
        context.queryClient.invalidateQueries({ queryKey: ['worldWideWebControllerStatus'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        const message = `World Wide Web Controller role revoked successfully from: ${args[0]}`;
        return { success: true, message: appendAuditWarning(message, auditWarning) };
      } catch (error: any) {
        await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.worldWideWebControllerPrivilegeChange,
          details: `Terminal command failed: www-controller-revoke ${args[0]} - ${error.message}`,
          success: false,
          severity: T__2.critical,
        });
        return { success: false, message: `Failed to revoke World Wide Web Controller role: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'www-controller-status',
    aliases: ['is-www-controller', 'check-www-controller', 'web-control-status'],
    description: 'Check if current user has World Wide Web Controller role',
    category: 'World Wide Web Controller',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const hasRole = await context.actor.hasWorldWideWebControllerRole();
        
        const auditWarning = await tryRecordAuditEntry(context, {
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
          actionType: T__1.general,
          details: 'Terminal command: www-controller-status executed',
          success: true,
          severity: T__2.info,
        });

        const status = hasRole ? 'YES - You have World Wide Web Controller role' : 'NO - You do not have World Wide Web Controller role';
        return { success: true, message: appendAuditWarning(status, auditWarning) };
      } catch (error: any) {
        return { success: false, message: `Failed to check World Wide Web Controller status: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== Audit Log Operations =====
  {
    name: 'audit-export',
    aliases: ['export-audit'],
    description: 'Export complete audit log to JSON (Security/App Controller only)',
    category: 'Audit',
    usage: 'audit-export',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const logs = await context.actor.exportAuditLogToJson();
        const json = JSON.stringify(logs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        return { success: true, message: `Audit log exported successfully (${logs.length} entries)` };
      } catch (error: any) {
        return { success: false, message: `Failed to export audit log: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'audit-recent',
    aliases: ['recent-audit'],
    description: 'Show recent audit log entries',
    category: 'Audit',
    usage: 'audit-recent [count]',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const count = args[0] ? parseInt(args[0]) : 10;
        if (isNaN(count) || count < 1) {
          return { success: false, message: 'Invalid count. Usage: audit-recent [count]' };
        }

        const logs = await context.actor.getAuditLogs({});
        const recent = logs.slice(0, count);

        if (recent.length === 0) {
          return { success: true, message: 'No audit log entries found.' };
        }

        let output = `Recent Audit Log Entries (${recent.length}):\n\n`;
        recent.forEach((entry, index) => {
          output += `${index + 1}. [${formatTimestamp(entry.timestamp)}] ${entry.actionType}\n`;
          output += `   User: ${entry.user.toString()}\n`;
          output += `   Details: ${entry.details}\n`;
          output += `   Severity: ${entry.severity}\n`;
          if (entry.success !== undefined && entry.success !== null) {
            output += `   Success: ${entry.success}\n`;
          }
          output += '\n';
        });

        return { success: true, message: output.trim() };
      } catch (error: any) {
        return { success: false, message: `Failed to retrieve audit logs: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== User Profile Operations =====
  {
    name: 'profile-view',
    aliases: ['view-profile', 'whoami'],
    description: 'View current user profile',
    category: 'User',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const profile = await context.actor.getCallerUserProfile();
        if (!profile) {
          return { success: true, message: 'No profile found. Please set up your profile first.' };
        }

        const principal = context.identity.getPrincipal().toString();
        let output = 'Your Profile:\n\n';
        output += `Name: ${profile.name}\n`;
        output += `Principal: ${principal}`;

        return { success: true, message: output };
      } catch (error: any) {
        return { success: false, message: `Failed to retrieve profile: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== User Management =====
  {
    name: 'user-flag',
    aliases: ['flag-user'],
    description: 'Flag a user as suspicious (Security/App Controller only)',
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

        context.queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        return { success: true, message: `User flagged successfully: ${args[0]}` };
      } catch (error: any) {
        return { success: false, message: `Failed to flag user: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'user-unflag',
    aliases: ['unflag-user'],
    description: 'Remove flag from a user (Security/App Controller only)',
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

        context.queryClient.invalidateQueries({ queryKey: ['flaggedUsers'] });

        return { success: true, message: `User unflagged successfully: ${args[0]}` };
      } catch (error: any) {
        return { success: false, message: `Failed to unflag user: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'user-list-flagged',
    aliases: ['list-flagged-users'],
    description: 'List all flagged users (Security/App Controller only)',
    category: 'User Management',
    usage: 'user-list-flagged',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const flaggedUsers = await context.actor.getFlaggedUsers();

        if (flaggedUsers.length === 0) {
          return { success: true, message: 'No flagged users found.' };
        }

        let output = `Flagged Users (${flaggedUsers.length}):\n\n`;
        flaggedUsers.forEach((user, index) => {
          output += `${index + 1}. ${user.toString()}\n`;
        });

        return { success: true, message: output.trim() };
      } catch (error: any) {
        return { success: false, message: `Failed to list flagged users: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== Broadcasting Configuration =====
  {
    name: 'broadcast-config',
    aliases: ['config-broadcast'],
    description: 'Configure external broadcasting (Security/App Controller only)',
    category: 'Broadcasting',
    usage: 'broadcast-config <enable|disable> [endpoint-url]',
    execute: async (args, context) => {
      if (args.length === 0) {
        return { success: false, message: 'Usage: broadcast-config <enable|disable> [endpoint-url]' };
      }

      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const action = args[0].toLowerCase();
        if (action !== 'enable' && action !== 'disable') {
          return { success: false, message: 'Invalid action. Use "enable" or "disable".' };
        }

        const enabled = action === 'enable';
        const endpointUrl = args[1] || null;

        await context.actor.configureExternalBroadcasting(enabled, endpointUrl);

        context.queryClient.invalidateQueries({ queryKey: ['externalBroadcastingSettings'] });
        context.queryClient.invalidateQueries({ queryKey: ['auditLogs'] });

        return { success: true, message: `Broadcasting ${enabled ? 'enabled' : 'disabled'} successfully${endpointUrl ? ` with endpoint: ${endpointUrl}` : ''}` };
      } catch (error: any) {
        return { success: false, message: `Failed to configure broadcasting: ${classifyError(error, context)}` };
      }
    },
  },
  {
    name: 'broadcast-status',
    aliases: ['status-broadcast'],
    description: 'View current broadcasting configuration (Security/App Controller only)',
    category: 'Broadcasting',
    usage: 'broadcast-status',
    execute: async (args, context) => {
      const authCheck = requiresBackendAndAuth(context);
      if (authCheck) {
        return { success: false, message: authCheck };
      }

      try {
        const settings = await context.actor.getExternalBroadcastingSettings();

        let output = 'Broadcasting Configuration:\n\n';
        output += `Status: ${settings.enabled ? 'Enabled' : 'Disabled'}\n`;
        output += `Endpoint: ${settings.endpointUrl || 'Not configured'}`;

        return { success: true, message: output };
      } catch (error: any) {
        return { success: false, message: `Failed to retrieve broadcasting status: ${classifyError(error, context)}` };
      }
    },
  },

  // ===== Local Diagnostics =====
  {
    name: 'echo',
    description: 'Echo back the provided arguments',
    category: 'Diagnostics',
    usage: 'echo <message>',
    execute: async (args) => ({
      success: true,
      message: args.join(' ') || '',
    }),
  },
  {
    name: 'date',
    description: 'Display current date and time',
    category: 'Diagnostics',
    execute: async () => ({
      success: true,
      message: new Date().toString(),
    }),
  },
];
