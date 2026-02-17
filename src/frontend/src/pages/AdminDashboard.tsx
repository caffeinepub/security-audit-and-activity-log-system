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
import IcpControllerManagementPanel from '../components/IcpControllerManagementPanel';
import RolesAccessPanel from '../components/RolesAccessPanel';

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

  // Get all logs for real-time panels (no filter)
  const allLogsFilter: FilterCriteria = useMemo(() => ({} as FilterCriteria), []);
  const { data: allLogs } = useGetAuditLogs(allLogsFilter);

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
      unauthorizedAttempt: { variant: 'destructive', label: 'Unauthorized Attempt', icon: '/assets/generated/unauthorized-access.dim_64x64.png' },
      configUpload: { variant: 'outline', label: 'Config Upload', icon: '/assets/generated/config-change.dim_64x64.png' },
      general: { variant: 'outline', label: 'General', icon: '/assets/generated/notification-bell.dim_64x64.png' },
      superuserPrivilegeChange: { variant: 'default', label: 'Superuser Privilege Change', icon: '/assets/generated/role-change.dim_64x64.png' },
    };
    return configs[type] || { variant: 'outline', label: type, icon: '/assets/generated/notification-bell.dim_64x64.png' };
  };

  const getSeverityConfig = (severity: EventSeverity) => {
    const configs: Record<string, { variant: any; label: string }> = {
      info: { variant: 'default', label: 'Info' },
      warning: { variant: 'secondary', label: 'Warning' },
      critical: { variant: 'destructive', label: 'Critical' },
    };
    return configs[severity] || { variant: 'outline', label: severity };
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {showAccessGranted && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Access granted! You now have Security Dashboard access.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          {isAppController && (
            <Badge variant="default" className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              App Controller
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <IcpConnectionPanel />
          <AuthStatusPanel />
        </div>

        <RolesAccessPanel />

        <IcpControlsPanel />

        <RealTimeAlertPanel logs={allLogs || []} />

        <SecuritySummaryPanel logs={allLogs || []} />

        <TestActionsPanel />

        <SuperuserAuditPanel currentLogs={logs || []} />

        <RootTerminalPanel />

        <BroadcastConfigPanel />

        <UserManagementPanel />

        {isAppController && <IcpControllerManagementPanel />}

        {isAppController && <DeploymentPanel />}

        {isAppController && <IcpMainnetDeploymentPanel />}

        {isAppController && <CodeEditorPanel />}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Audit Log Viewer
            </CardTitle>
            <CardDescription>
              View and filter security audit logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <Label htmlFor="actionType">Action Type</Label>
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
                      <SelectItem value="unauthorizedAttempt">Unauthorized Attempt</SelectItem>
                      <SelectItem value="configUpload">Config Upload</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="superuserPrivilegeChange">Superuser Privilege Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
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

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action Type</TableHead>
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
                            {format(Number(log.timestamp) / 1_000_000, 'MMM dd, yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[150px] truncate">
                            {log.user.toString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={actionConfig.variant as any}>
                              {actionConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={severityConfig.variant as any}>
                              {severityConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {log.details}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
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
              <Alert>
                <AlertDescription>
                  No audit logs found matching the current filters.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>

      {selectedLog && (
        <AuditLogDetailDialog
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
