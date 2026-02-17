import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerAppControllerStatus, useGetCallerSecurityStatus, useGetCallerIcpControllerStatus } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Crown, ShieldCheck, Server } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAppController } = useGetCallerAppControllerStatus();
  const { data: isSecurity } = useGetCallerSecurityStatus();
  const { data: isIcpController } = useGetCallerIcpControllerStatus();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const buttonText = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const hasSecurityAccess = isAppController || isSecurity;
  const hasIcpControllerOnlyAccess = isIcpController && !hasSecurityAccess;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error('Login failed. Please try again.');
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getHeaderTitle = () => {
    if (hasSecurityAccess) {
      return 'Caffeine Security Console';
    }
    if (hasIcpControllerOnlyAccess) {
      return 'Caffeine ICP Operations';
    }
    return 'Caffeine Security Console';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {getHeaderTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {userProfile.name}
              </span>
              {isAppController && (
                <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-white">
                  <Crown className="h-3 w-3" />
                  <span className="hidden sm:inline">App Controller</span>
                </Badge>
              )}
              {isSecurity && !isAppController && (
                <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 px-2 py-0.5 text-white">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Security</span>
                </Badge>
              )}
              {isIcpController && !isAppController && !isSecurity && (
                <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 px-2 py-0.5 text-white">
                  <Server className="h-3 w-3" />
                  <span className="hidden sm:inline">ICP Controller</span>
                </Badge>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            onClick={handleAuth}
            disabled={disabled}
            variant={isAuthenticated ? 'outline' : 'default'}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </header>
  );
}
