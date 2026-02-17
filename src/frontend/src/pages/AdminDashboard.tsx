import { useState, useMemo } from 'react';
import { useGetAuditLogs, useGetCallerAppControllerStatus } from '../hooks/useQueries';
import type { T__4 as FilterCriteria, T__1 as ActionType, T__2 as EventSeverity } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Filter, X, Calendar, User, Activity, RefreshCw, CheckCircle2, Crown } from 'lucide-react';
import { format } from 'date-fns';
import AuditLogDetailDialog from '../components/AuditLogDetailDialog';
import TestActionsPanel from '../components/TestActionsPanel';
import UserManagementPanel from '../components/UserManagementPanel';
import SecuritySummaryPanel from '../components/SecuritySummaryPanel';
import BroadcastConfigPanel from '../components/BroadcastConfigPanel';
import RealTimeAlertPanel from '../components/RealTimeAlertPanel';
import DeploymentPanel from '../components/DeploymentPanel';
import CodeEditorPanel from '../components/CodeEditorPanel';
import IcpConnectionPanel from '../components/IcpConnectionPanel';
import IcpControlsPanel from '../components/IcpControlsPanel';
import AuthStatusPanel from '../components/AuthStatusPanel';
import IcpMainnetDeploymentPanel from '../components/IcpMainnetDeploymentPanel';
import SuperuserAuditPanel from '../components/SuperuserAuditPanel';
import RootTerminalPanel from '../components/RootTerminalPanel';

interface AdminDashboardProps {
  showAccessGranted?: boolean;
}

export default function AdminDashboard({ showAccessGranted = false }: AdminDashboardProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [userPrincipal, setUserPrincipal] = useState('');
  const [actionType, setActionType] = useState<string>('all');
  const [severity, setSeverity] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { data: isAppController } = useGetCallerAppControllerStatus();

  const filter: FilterCriteria = useMemo(() => {
    const f: Partial<FilterCriteria> = {};
    if (fromDate) {
      f.fromDate = BigInt(new Date(fromDate).getTime()) * BigInt(1_000_000);
    }
    if (toDate) {
      f.toDate = BigInt(new Date(toDate).getTime()) * BigInt(1_000_000);
    }
    if (userPrincipal.trim()) {
      try {
        f.user = userPrincipal.trim() as any;
      } catch (e) {
        console.error('Invalid principal:', e);
      }
    }
    if (actionType !== 'all') {
      f.actionType = actionType as any;
    }
    if (severity !== 'all') {
      f.severity = severity as any;
    }
    return f as FilterCriteria;
  }, [fromDate, toDate, userPrincipal, actionType, severity]);

  const { data: logs, isLoading, refetch } = useGetAuditLogs(filter);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setUserPrincipal('');
    setActionType('all');
    setSeverity('all');
  };

  const hasActiveFilters = fromDate || toDate || userPrincipal || actionType !== 'all' || severity !== 'all';

  const getActionTypeConfig = (type: ActionType) => {
    const configs: Record<string, { variant: any; label: string; icon: string }> = {
      loginAttempt: { variant: 'default', label: 'Login Attempt', icon: '/assets/generated/login-attempt.dim_64x64.png' },
      permissionChange: { variant: 'secondary', label: 'Permission Change', icon: '/assets/generated/role-change.dim_64x64.png' },
      dataExport: { variant: 'outline', label: 'Data Export', icon: '/assets/generated/data-export.dim_64x64.png' },
      dataImport: { variant: 'outline', label: 'Data Import', icon: '/assets/generated/data-import.dim_64x64.png' },
      accountChange: { variant: 'secondary', label: 'Account Change', icon: '/assets/generated/account-create.dim_64x64.png' },
      unauthorizedAttempt: { variant: 'destructive', label: 'Unauthorized Access', icon: '/assets/generated/unauthorized-access.dim_64x64.png' },
      configUpload: { variant: 'destructive', label: 'Config Upload', icon: '/assets/generated/file-upload.dim_64x64.png' },
      general: { variant: 'default', label: 'General', icon: '/assets/generated/security-shield-check.dim_64x64.png' },
    };
    return configs[type] || { variant: 'default', label: type, icon: '/assets/generated/security-shield-check.dim_64x64.png' };
  };

  const getSeverityConfig = (sev: EventSeverity) => {
    const configs: Record<string, { color: string; label: string; bgColor: string }> = {
      info: { color: 'text-green-600 dark:text-green-400', label: 'Info', bgColor: 'bg-green-100 dark:bg-green-950' },
      warning: { color: 'text-yellow-600 dark:text-yellow-400', label: 'Warning', bgColor: 'bg-yellow-100 dark:bg-yellow-950' },
      critical: { color: 'text-red-600 dark:text-red-400', label: 'Critical', bgColor: 'bg-red-100 dark:bg-red-950' },
    };
    return configs[sev] || configs.info;
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / BigInt(1_000_000)));
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  };

  const formatPrincipal = (principal: any) => {
    const str = principal.toString();
    if (str.length > 20) {
      return `${str.slice(0, 10)}...${str.slice(-8)}`;
    }
    return str;
  };

  return (
    <div className="container py-8 space-y-6">
      {showAccessGranted && (
        <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Access granted: You are now the sole App Controller with unrestricted access to all audit logs, configurations, and user management.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Audit Log Dashboard</h1>
            {isAppController && (
              <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-white">
                <Crown className="h-4 w-4" />
                App Controller
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Monitor and review all system activity with full administrative control</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <IcpConnectionPanel />

      <IcpControlsPanel />

      <AuthStatusPanel />

      <RealTimeAlertPanel logs={logs || []} />

      <SecuritySummaryPanel logs={logs || []} />

      <SuperuserAuditPanel currentLogs={logs || []} />

      <RootTerminalPanel />

      <BroadcastConfigPanel />

      <UserManagementPanel />

      {isAppController && <DeploymentPanel />}

      {isAppController && <IcpMainnetDeploymentPanel />}

      {isAppController && <CodeEditorPanel />}

      <TestActionsPanel />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>Filter audit logs by date, user, action type, or severity</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="fromDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                From Date
              </Label>
              <Input
                id="fromDate"
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                To Date
              </Label>
              <Input
                id="toDate"
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userPrincipal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User Principal
              </Label>
              <Input
                id="userPrincipal"
                placeholder="Enter principal ID"
                value={userPrincipal}
                onChange={(e) => setUserPrincipal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionType" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Action Type
              </Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger id="actionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="loginAttempt">Login Attempt</SelectItem>
                  <SelectItem value="permissionChange">Permission Change</SelectItem>
                  <SelectItem value="dataExport">Data Export</SelectItem>
                  <SelectItem value="dataImport">Data Import</SelectItem>
                  <SelectItem value="accountChange">Account Change</SelectItem>
                  <SelectItem value="unauthorizedAttempt">Unauthorized Access</SelectItem>
                  <SelectItem value="configUpload">Config Upload</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Severity
              </Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            {logs ? `Showing ${logs.length} entries` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => {
                    const actionConfig = getActionTypeConfig(log.actionType);
                    const severityConfig = getSeverityConfig(log.severity);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatPrincipal(log.user)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionConfig.variant as any}>
                            {actionConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${severityConfig.bgColor} ${severityConfig.color}`}>
                            {severityConfig.label}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.details}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => setSelectedLog(log)}
                            variant="ghost"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No audit log entries found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLog && (
        <AuditLogDetailDialog
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
