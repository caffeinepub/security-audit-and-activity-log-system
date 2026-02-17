import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Lock } from 'lucide-react';

export default function AccessDeniedScreen() {
  const { login, identity, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
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
        <CardContent className="flex justify-center">
          {!isAuthenticated && (
            <Button onClick={login} disabled={loginStatus === 'logging-in'} size="lg">
              {loginStatus === 'logging-in' ? 'Logging in...' : 'Login to Continue'}
            </Button>
          )}
          {isAuthenticated && (
            <p className="text-sm text-muted-foreground text-center">
              This system is restricted to the App Controller and authorized Security personnel only.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
