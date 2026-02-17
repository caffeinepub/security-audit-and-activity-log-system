import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerAppControllerStatus, useGetCallerSecurityStatus, useInitializeAppController } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import AdminDashboard from './pages/AdminDashboard';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAppController, isLoading: appControllerLoading } = useGetCallerAppControllerStatus();
  const { data: isSecurity, isLoading: securityLoading, isFetched: securityFetched } = useGetCallerSecurityStatus();
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

  // Handle app controller or security access confirmation
  useEffect(() => {
    if (isAuthenticated && (isAppController || isSecurity) && !showAccessGranted) {
      setShowAccessGranted(true);
      // Hide the confirmation message after 5 seconds
      const timer = setTimeout(() => {
        setShowAccessGranted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isAppController, isSecurity, showAccessGranted]);

  // Show loading state while checking authentication, profile, and security status
  if (loginStatus === 'initializing' || (isAuthenticated && (profileLoading || appControllerLoading || securityLoading))) {
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

  // Show access denied if not authenticated or neither app controller nor security
  const hasAccess = isAppController || isSecurity;
  if (!isAuthenticated || !hasAccess) {
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
          <AdminDashboard showAccessGranted={showAccessGranted} />
        </main>
        <Footer />
      </div>
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </ThemeProvider>
  );
}
