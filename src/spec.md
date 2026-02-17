# Specification

## Summary
**Goal:** Allow authenticated ICP Controller users to access an ICP operations console and a restricted terminal mode for connectivity/configuration tasks, while keeping the existing Security Dashboard limited to App Controller or Security users.

**Planned changes:**
- Update frontend access gating to allow ICP Controller users into an ICP-operations experience while preserving the existing App Controller/Security-only AdminDashboard security console.
- Add a new ICP Controller-focused page/panel that shows ICP connection status (effective network + canister ID), ICP controls catalog (import/export/reset), and authentication status (principal display/copy), with English labels/copy emphasizing operations (not security/auditing).
- Ensure ICP Controller-only users do not see security/audit/admin panels (e.g., audit log, user management, broadcasting config, role management, deployment/editor/testing/alerts panels).
- Add an ICP Controller-only terminal mode (or separate terminal instance) that exposes only safe ICP operations/diagnostic/profile commands; hide restricted commands and show clear “insufficient privileges” messaging if attempted.
- Update backend authorization with an explicit ICP Controller authorization helper and add only minimal new backend APIs (if needed) for ICP Controller workflows, without widening access to any Security/App Controller-only endpoints.

**User-visible outcome:** ICP Controller users can log in and access an ICP operations console (connection/config tools + principal info) and a safe, restricted terminal, while App Controller/Security users continue to access the unchanged security dashboard and full terminal command set.
