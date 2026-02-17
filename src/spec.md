# Specification

## Summary
**Goal:** Provide a distinct “Web Control” terminal experience in the ICP Ops Console for users with the World Wide Web Controller role.

**Planned changes:**
- Update `frontend/src/pages/IcpOpsDashboard.tsx` to select a Web Control-specific terminal command registry when the authenticated user has the World Wide Web Controller role (and not the ICP Controller role), while preserving the existing ICP Controller behavior.
- Add a new safe Web Control terminal command registry file under `frontend/src/terminal/` that includes at minimum: `help`, `clear`, and a role self-check command (e.g., `web-controller-status`) that uses a real backend canister call to report World Wide Web Controller role status in English.
- Ensure each Web Control terminal command attempts best-effort audit recording using existing guard/audit helper patterns, and that audit-recording failures do not cause the command to fail (with a clear English warning where needed).

**User-visible outcome:** Users with the World Wide Web Controller role see and use a Web Control-safe terminal command set (including a status/self-check command), while ICP Controller users continue to see the existing ICP Controller terminal commands.
