import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerAppControllerStatus, useGetCallerSecurityStatus, useGetCallerIcpControllerStatus, useInitializeAppController } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import AdminDashboard from './pages/AdminDashboard';
import IcpOpsDashboard from './pages/IcpOpsDashboard';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAppController, isLoading: appControllerLoading } = useGetCallerAppControllerStatus();
  const { data: isSecurity, isLoading: securityLoading, isFetched: securityFetched } = useGetCallerSecurityStatus();
  const { data: isIcpController, isLoading: icpControllerLoading, isFetched: icpControllerFetched } = useGetCallerIcpControllerStatus();
  const initializeAppController = useInitializeAppController();
  const [showAccessGranted, setShowAccessGranted] = useState(false);

  // Reset access granted message on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAccessGranted(false);
    }
  }, [isAuthenticated]);

  // Automatically initialize app controller on first login
  useEffect(() => {
    if (isAuthenticated && !appControllerLoading && isAppController === false && !initializeAppController.isPending) {
      initializeAppController.mutate();
    }
  }, [isAuthenticated, appControllerLoading, isAppController, initializeAppController]);

  // Handle app controller, security, or ICP controller access confirmation
  useEffect(() => {
    if (isAuthenticated && (isAppController || isSecurity || isIcpController) && !showAccessGranted) {
      setShowAccessGranted(true);
      // Hide the confirmation message after 5 seconds
      const timer = setTimeout(() => {
        setShowAccessGranted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isAppController, isSecurity, isIcpController, showAccessGranted]);

  // Show loading state while checking authentication, profile, security status, and ICP controller status
  if (loginStatus === 'initializing' || (isAuthenticated && (profileLoading || appControllerLoading || securityLoading || icpControllerLoading))) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup modal if user is authenticated but has no profile
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Determine access level
  const hasSecurityAccess = isAppController || isSecurity;
  const hasIcpControllerOnlyAccess = isIcpController && !hasSecurityAccess;
  const hasAnyAccess = hasSecurityAccess || hasIcpControllerOnlyAccess;

  // Show access denied if not authenticated or no access
  if (!isAuthenticated || !hasAnyAccess) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <AccessDeniedScreen />
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {hasSecurityAccess ? (
            <AdminDashboard showAccessGranted={showAccessGranted} />
          ) : (
            <IcpOpsDashboard showAccessGranted={showAccessGranted} />
          )}
        </main>
        <Footer />
      </div>
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </ThemeProvider>
  );
}
