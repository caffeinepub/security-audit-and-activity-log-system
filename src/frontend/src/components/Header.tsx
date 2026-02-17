import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerAppControllerStatus, useGetCallerSecurityStatus, useGetCallerIcpControllerStatus, useGetCallerWorldWideWebControllerStatus } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Crown, ShieldCheck, Server, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import DashboardViewSwitcher from './DashboardViewSwitcher';
import { DashboardView } from '../hooks/useDashboardView';

interface HeaderProps {
  selectedView?: DashboardView;
  onSelectView?: (view: DashboardView) => void;
  allowedViews?: DashboardView[];
  canSwitchViews?: boolean;
}

export default function Header({ selectedView, onSelectView, allowedViews, canSwitchViews }: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAppController } = useGetCallerAppControllerStatus();
  const { data: isSecurity } = useGetCallerSecurityStatus();
  const { data: isIcpController } = useGetCallerIcpControllerStatus();
  const { data: isWorldWideWebController } = useGetCallerWorldWideWebControllerStatus();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const buttonText = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const hasSecurityAccess = isAppController || isSecurity;
  const hasIcpOpsAccess = isIcpController || isWorldWideWebController;

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
    // Use selectedView if provided (for authenticated users with view switcher)
    if (selectedView === 'icp-ops') {
      return 'Caffeine ICP Operations';
    }
    if (selectedView === 'security') {
      return 'Caffeine Security Console';
    }

    // Fallback to role-based title
    if (hasSecurityAccess) {
      return 'Caffeine Security Console';
    }
    if (hasIcpOpsAccess) {
      return 'Caffeine ICP Operations';
    }
    return 'Caffeine Security Console';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
            {getHeaderTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* View switcher for users with multiple access levels */}
          {canSwitchViews && selectedView && onSelectView && allowedViews && (
            <DashboardViewSwitcher
              selectedView={selectedView}
              onSelectView={onSelectView}
              allowedViews={allowedViews}
              canSwitchViews={canSwitchViews}
            />
          )}

          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline truncate max-w-[120px]">
                {userProfile.name}
              </span>
              {isAppController && (
                <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-white flex-shrink-0">
                  <Crown className="h-3 w-3" />
                  <span className="hidden lg:inline">App Controller</span>
                </Badge>
              )}
              {isSecurity && !isAppController && (
                <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 px-2 py-0.5 text-white flex-shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="hidden lg:inline">Security</span>
                </Badge>
              )}
              {isIcpController && !isAppController && !isSecurity && (
                <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 px-2 py-0.5 text-white flex-shrink-0">
                  <Server className="h-3 w-3" />
                  <span className="hidden lg:inline">ICP Controller</span>
                </Badge>
              )}
              {isWorldWideWebController && !isAppController && !isSecurity && !isIcpController && (
                <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 px-2 py-0.5 text-white flex-shrink-0">
                  <Globe className="h-3 w-3" />
                  <span className="hidden lg:inline">Web Control</span>
                </Badge>
              )}
            </div>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="flex-shrink-0">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button onClick={handleAuth} disabled={disabled} variant={isAuthenticated ? 'outline' : 'default'} size="sm" className="flex-shrink-0">
            {buttonText}
          </Button>
        </div>
      </div>
    </header>
  );
}
