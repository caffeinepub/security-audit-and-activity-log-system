# Specification

## Summary
**Goal:** Remove “refresh” behavior by eliminating page reloads and disabling automatic React Query refetches, while keeping manual connection re-checks and user-initiated updates working.

**Planned changes:**
- Replace the Web Controller Tools “Refresh Connection” action in `frontend/src/components/WebControlQuickToolsPanel.tsx` so it no longer calls `window.location.reload()` and instead triggers a non-reload connectivity re-check.
- Disable React Query automatic refetch triggers (e.g., refetch on window focus and on reconnect) so queries update only via explicit user actions or mutation-driven invalidation.
- Remove broad/global React Query refetch patterns tied to actor creation/changes, keeping targeted correctness for identity/ICP target changes without introducing new loading screens or refresh-like behavior.

**User-visible outcome:** Users can manually re-check backend connectivity from the Web Controller Tools without any page reload, and the app no longer silently “refreshes” data when the tab regains focus, the network reconnects, or an actor instance changes.
