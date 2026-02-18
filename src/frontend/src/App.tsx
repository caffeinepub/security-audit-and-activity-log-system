import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerAppControllerStatus, useGetCallerSecurityStatus, useGetCallerIcpControllerStatus, useGetCallerWorldWideWebControllerStatus } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import AdminDashboard from './pages/AdminDashboard';
import IcpOpsDashboard from './pages/IcpOpsDashboard';
import InlineLoadingState from './components/InlineLoadingState';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useDashboardView } from './hooks/useDashboardView';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAppController, isLoading: appControllerLoading } = useGetCallerAppControllerStatus();
  const { data: isSecurityUser, isLoading: securityLoading } = useGetCallerSecurityStatus();
  const { data: isIcpController, isLoading: icpControllerLoading } = useGetCallerIcpControllerStatus();
  const { data: isWorldWideWebController, isLoading: wwwControllerLoading } = useGetCallerWorldWideWebControllerStatus();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Determine access levels
  const hasSecurityAccess = isAppController || isSecurityUser;
  const hasIcpOpsAccess = isIcpController || isWorldWideWebController;
  const hasAnyAccess = hasSecurityAccess || hasIcpOpsAccess;

  const { selectedView, onSelectView, allowedViews, canSwitchViews } = useDashboardView(
    hasSecurityAccess || false,
    hasIcpOpsAccess || false,
    isAuthenticated
  );

  // Check if we're still loading role information for authenticated users
  const isLoadingRoles = isAuthenticated && (appControllerLoading || securityLoading || icpControllerLoading || wwwControllerLoading);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          selectedView={selectedView}
          onSelectView={onSelectView}
          allowedViews={allowedViews}
          canSwitchViews={canSwitchViews}
        />

        {showProfileSetup ? (
          <ProfileSetupModal />
        ) : !isAuthenticated ? (
          <AccessDeniedScreen />
        ) : (
          <main className="flex-1">
            {isLoadingRoles ? (
              <div className="container mx-auto px-4 py-6 sm:py-8">
                <InlineLoadingState message="Checking access..." />
              </div>
            ) : !hasAnyAccess ? (
              <AccessDeniedScreen />
            ) : (
              <>
                {selectedView === 'security' && hasSecurityAccess && <AdminDashboard />}
                {selectedView === 'icp-ops' && hasIcpOpsAccess && <IcpOpsDashboard />}
              </>
            )}
          </main>
        )}

        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
