import { useState, useEffect } from 'react';

export type DashboardView = 'security' | 'icp-ops';

const SESSION_KEY = 'caffeine-dashboard-view';

export function useDashboardView(
  hasSecurityAccess: boolean,
  hasIcpOpsAccess: boolean,
  isAuthenticated: boolean
) {
  const [selectedView, setSelectedView] = useState<DashboardView>(() => {
    if (!isAuthenticated) return 'security';
    
    const stored = sessionStorage.getItem(SESSION_KEY) as DashboardView | null;
    
    if (stored === 'security' && hasSecurityAccess) return 'security';
    if (stored === 'icp-ops' && hasIcpOpsAccess) return 'icp-ops';
    
    if (hasSecurityAccess) return 'security';
    if (hasIcpOpsAccess) return 'icp-ops';
    
    return 'security';
  });

  const allowedViews: DashboardView[] = [];
  if (hasSecurityAccess) allowedViews.push('security');
  if (hasIcpOpsAccess) allowedViews.push('icp-ops');

  const canSwitchViews = allowedViews.length > 1;

  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }

    if (!allowedViews.includes(selectedView)) {
      const fallback = allowedViews[0] || 'security';
      setSelectedView(fallback);
      sessionStorage.setItem(SESSION_KEY, fallback);
    }
  }, [hasSecurityAccess, hasIcpOpsAccess, isAuthenticated, selectedView, allowedViews]);

  const onSelectView = (view: DashboardView) => {
    if (allowedViews.includes(view)) {
      setSelectedView(view);
      sessionStorage.setItem(SESSION_KEY, view);
    }
  };

  return {
    selectedView,
    onSelectView,
    allowedViews,
    canSwitchViews,
  };
}
