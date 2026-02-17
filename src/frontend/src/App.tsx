import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerAppControllerStatus, useGetCallerSecurityStatus, useGetCallerIcpControllerStatus } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import AdminDashboard from './pages/AdminDashboard';
import IcpOpsDashboard from './pages/IcpOpsDashboard';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useDashboardView } from './hooks/useDashboardView';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAppController, isLoading: appControllerLoading } = useGetCallerAppControllerStatus();
  const { data: isSecurityUser, isLoading: securityLoading } = useGetCallerSecurityStatus();
  const { data: isIcpController, isLoading: icpControllerLoading } = useGetCallerIcpControllerStatus();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Determine access levels
  const hasSecurityAccess = isAppController || isSecurityUser;
  const hasIcpControllerAccess = isIcpController;
  const hasAnyAccess = hasSecurityAccess || hasIcpControllerAccess;

  const { selectedView, onSelectView, allowedViews, canSwitchViews } = useDashboardView(
    hasSecurityAccess || false,
    hasIcpControllerAccess || false,
    isAuthenticated
  );

  // Show loading state while checking authentication and roles
  if (isInitializing || (isAuthenticated && (profileLoading || appControllerLoading || securityLoading || icpControllerLoading))) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

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
        ) : !isAuthenticated || !hasAnyAccess ? (
          <AccessDeniedScreen />
        ) : selectedView === 'security' && hasSecurityAccess ? (
          <AdminDashboard />
        ) : selectedView === 'icp-ops' && hasIcpControllerAccess ? (
          <IcpOpsDashboard />
        ) : (
          <AccessDeniedScreen />
        )}

        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
