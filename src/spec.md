# Specification

## Summary
**Goal:** Expand the Web Control terminal and ICP Operations Console experience for World Wide Web Controller users with a large, safe, read-only/self-service command set and a dedicated “Quick Tools” UI section.

**Planned changes:**
- Extend the Web Control terminal registry to include safe command categories: read-only ICP diagnostics, frontend-side operational tools, and self-service role/principal confirmation helpers (no security/audit/role-admin/user-management/broadcasting-config capabilities).
- Implement a data-driven Web Control command catalog that exposes at least 200 distinct commands discoverable via `help`, keeping `help` grouped and readable.
- Ensure every Web Control command (existing and new) attempts best-effort audit recording via the existing guard/audit helper pattern and never fails solely due to audit logging issues; surface non-blocking English warnings on audit failures.
- Add a Web Control “Quick Tools” section in the ICP Operations Console for World Wide Web Controller users, exposing safe frontend-only actions (e.g., copy principal, export/import/reset ICP Controls settings JSON, refresh/retry connection checks) without Security Dashboard-only functionality.

**User-visible outcome:** World Wide Web Controller users can discover and run hundreds of safe Web Control commands (grouped in `help`) and use a new “Quick Tools” UI section for frontend-only utilities and self-service actions, with consistent English output and non-blocking audit warnings if audit recording is unavailable.
