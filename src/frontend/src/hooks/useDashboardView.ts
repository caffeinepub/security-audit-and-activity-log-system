import { useState, useEffect } from 'react';
import { getSessionParameter, storeSessionParameter, clearSessionParameter } from '../utils/urlParams';

export type DashboardView = 'security' | 'icp-ops';

const DASHBOARD_VIEW_KEY = 'dashboard-view';

/**
 * Hook that manages the selected dashboard view with session-scoped persistence.
 * Validates the persisted selection against currently allowed views and provides
 * a safe fallback when roles/access change.
 */
export function useDashboardView(
  hasSecurityAccess: boolean,
  hasIcpControllerAccess: boolean,
  isAuthenticated: boolean
) {
  // Determine which views are allowed based on current roles
  const allowedViews: DashboardView[] = [];
  if (hasSecurityAccess) allowedViews.push('security');
  if (hasIcpControllerAccess) allowedViews.push('icp-ops');

  // Initialize from session storage or default to first allowed view
  const [selectedView, setSelectedView] = useState<DashboardView>(() => {
    if (!isAuthenticated || allowedViews.length === 0) {
      return 'security'; // Default fallback
    }

    const persisted = getSessionParameter(DASHBOARD_VIEW_KEY) as DashboardView | null;
    
    // Validate persisted view is still allowed
    if (persisted && allowedViews.includes(persisted)) {
      return persisted;
    }

    // Fall back to first allowed view
    return allowedViews[0];
  });

  // Update session storage when view changes
  useEffect(() => {
    if (isAuthenticated && allowedViews.length > 0) {
      storeSessionParameter(DASHBOARD_VIEW_KEY, selectedView);
    }
  }, [selectedView, isAuthenticated, allowedViews.length]);

  // Clear session storage on logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearSessionParameter(DASHBOARD_VIEW_KEY);
    }
  }, [isAuthenticated]);

  // Validate and correct view when allowed views change
  useEffect(() => {
    if (allowedViews.length > 0 && !allowedViews.includes(selectedView)) {
      setSelectedView(allowedViews[0]);
    }
  }, [allowedViews, selectedView]);

  const handleSelectView = (view: DashboardView) => {
    if (allowedViews.includes(view)) {
      setSelectedView(view);
    }
  };

  return {
    selectedView,
    onSelectView: handleSelectView,
    allowedViews,
    canSwitchViews: allowedViews.length > 1,
  };
}
