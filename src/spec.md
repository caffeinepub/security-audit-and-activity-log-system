# Specification

## Summary
**Goal:** Remove the global full-screen loading takeover and stop automatic/background data polling so the UI stays usable and data refresh happens only when the user explicitly triggers it.

**Planned changes:**
- Update `frontend/src/App.tsx` to stop rendering a full-screen centered spinner with “Loading...” during authentication/role/profile query in-flight states; keep the header/page shell visible and use inline loading states within the relevant sections.
- Ensure unauthenticated users can reach the Access Denied experience without being blocked by role queries finishing.
- Remove the audit log auto-refresh interval from `frontend/src/hooks/useQueries.ts` (eliminate/refactor `refetchInterval: 10000`).
- Configure the React Query `QueryClient` in `frontend/src/main.tsx` to disable implicit auto-refetch on window focus and reconnect.
- Add/keep an explicit manual refresh control (at minimum for audit logs) that triggers a refetch and visibly updates the displayed data when the backend is reachable.

**User-visible outcome:** The app no longer shows a full-screen “Loading...” page; the header and layout render immediately, loading is shown inline where needed, and audit logs/data only refresh when the user manually refreshes or after a user-initiated mutation triggers updates.
