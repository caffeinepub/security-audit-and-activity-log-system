import { Button } from '@/components/ui/button';
import { ShieldCheck, Server } from 'lucide-react';
import { DashboardView } from '../hooks/useDashboardView';

interface DashboardViewSwitcherProps {
  selectedView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  allowedViews: DashboardView[];
  canSwitchViews: boolean;
}

/**
 * View switcher control for users with multiple dashboard access levels.
 * Shows labeled buttons for Security Dashboard and ICP Operations with visual
 * indication of the currently selected view.
 */
export default function DashboardViewSwitcher({
  selectedView,
  onSelectView,
  allowedViews,
  canSwitchViews,
}: DashboardViewSwitcherProps) {
  // Only render if user can switch between views
  if (!canSwitchViews) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
      {allowedViews.includes('security') && (
        <Button
          variant={selectedView === 'security' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectView('security')}
          className="gap-2"
        >
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Security Dashboard</span>
          <span className="sm:hidden">Security</span>
        </Button>
      )}
      {allowedViews.includes('icp-ops') && (
        <Button
          variant={selectedView === 'icp-ops' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectView('icp-ops')}
          className="gap-2"
        >
          <Server className="h-4 w-4" />
          <span className="hidden sm:inline">ICP Operations</span>
          <span className="sm:hidden">ICP Ops</span>
        </Button>
      )}
    </div>
  );
}
