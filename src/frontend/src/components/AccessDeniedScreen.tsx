import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Lock, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import IcpConnectionPanel from './IcpConnectionPanel';
import IcpControlsPanel from './IcpControlsPanel';

export default function AccessDeniedScreen() {
  const { login, identity, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [copied, setCopied] = useState(false);

  const handleCopyPrincipal = async () => {
    if (!identity) return;
    
    const principal = identity.getPrincipal().toString();
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      toast.success('Principal ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy Principal ID');
    }
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              {isAuthenticated ? (
                <Lock className="h-8 w-8 text-destructive" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-destructive" />
              )}
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              {isAuthenticated
                ? 'You do not have permission to access the audit log system. Only the App Controller or authorized Security users can view security logs and manage users.'
                : 'Please log in to access the security audit system.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated && (
              <div className="flex justify-center">
                <Button onClick={login} disabled={loginStatus === 'logging-in'} size="lg">
                  {loginStatus === 'logging-in' ? 'Logging in...' : 'Login to Continue'}
                </Button>
              </div>
            )}
            
            {isAuthenticated && (
              <>
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <p className="font-medium">Superuser Access Required</p>
                    <p className="text-sm">
                      To enable Superuser access to ICP administrative features, the App Controller must grant the Security role to your Principal ID.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Your Principal ID:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-xs break-all">
                          {identity.getPrincipal().toString()}
                        </code>
                        <Button
                          onClick={handleCopyPrincipal}
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this Principal ID with the App Controller to request Security role access.
                    </p>
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>

        {isAuthenticated && (
          <>
            <IcpConnectionPanel />
            <IcpControlsPanel />
          </>
        )}
      </div>
    </div>
  );
}
