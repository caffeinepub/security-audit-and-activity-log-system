import { useState } from 'react';
import { useRecordAuditEntry } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogIn, Shield, Download, Upload, UserPlus, Lock, FileUp, Activity, Loader2 } from 'lucide-react';
import type { T__1 as ActionType, T__2 as EventSeverity } from '../backend';

export default function TestActionsPanel() {
  const [actionType, setActionType] = useState<ActionType>('loginAttempt' as ActionType);
  const [details, setDetails] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  const [sessionData, setSessionData] = useState('');
  const [success, setSuccess] = useState<string>('true');
  const [severity, setSeverity] = useState<EventSeverity>('info' as EventSeverity);

  const recordAuditEntry = useRecordAuditEntry();

  const handleSubmit = () => {
    if (details) {
      recordAuditEntry.mutate({
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        actionType,
        details,
        ipAddress: ipAddress || undefined,
        deviceInfo: deviceInfo || undefined,
        sessionData: sessionData || undefined,
        success: success === 'none' ? undefined : success === 'true',
        severity,
      });
      setDetails('');
      setIpAddress('');
      setDeviceInfo('');
      setSessionData('');
    }
  };

  const actionTypeOptions = [
    { value: 'loginAttempt', label: 'Login Attempt', icon: LogIn },
    { value: 'permissionChange', label: 'Permission Change', icon: Shield },
    { value: 'dataExport', label: 'Data Export', icon: Download },
    { value: 'dataImport', label: 'Data Import', icon: Upload },
    { value: 'accountChange', label: 'Account Change', icon: UserPlus },
    { value: 'unauthorizedAttempt', label: 'Unauthorized Access', icon: Lock },
    { value: 'configUpload', label: 'Config Upload', icon: FileUp },
    { value: 'general', label: 'General', icon: Activity },
  ];

  const selectedOption = actionTypeOptions.find(opt => opt.value === actionType);
  const Icon = selectedOption?.icon || Activity;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Security Audit Actions</CardTitle>
        <CardDescription>Record test audit entries to populate the security log with various event types</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="actionType" className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              Action Type
            </Label>
            <Select value={actionType} onValueChange={(value) => setActionType(value as ActionType)}>
              <SelectTrigger id="actionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level</Label>
            <Select value={severity} onValueChange={(value) => setSeverity(value as EventSeverity)}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="details">Event Details</Label>
          <Textarea
            id="details"
            placeholder="e.g., User attempted login from new device"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address (Optional)</Label>
            <Input
              id="ipAddress"
              placeholder="e.g., 192.168.1.1"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="success">Success Status</Label>
            <Select value={success} onValueChange={setSuccess}>
              <SelectTrigger id="success">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Success</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
                <SelectItem value="none">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviceInfo">Device Information (Optional)</Label>
          <Input
            id="deviceInfo"
            placeholder="e.g., Chrome 120.0 on Windows 11"
            value={deviceInfo}
            onChange={(e) => setDeviceInfo(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sessionData">Session Data (Optional)</Label>
          <Textarea
            id="sessionData"
            placeholder='e.g., {"sessionId": "abc123", "duration": "30m"}'
            value={sessionData}
            onChange={(e) => setSessionData(e.target.value)}
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!details || recordAuditEntry.isPending}
          className="w-full"
        >
          {recordAuditEntry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Audit Entry
        </Button>
      </CardContent>
    </Card>
  );
}
