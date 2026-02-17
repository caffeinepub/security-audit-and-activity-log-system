# Specification

## Summary
**Goal:** Make Root Terminal reflect real Internet Computer canister administration by removing simulated commands and ensuring admin actions run real backend operations.

**Planned changes:**
- Remove simulated/placeholder terminal commands from the frontend command registry so only backend-powered admin commands (and explicitly labeled local-only diagnostics) are available.
- Ensure all administrative Root Terminal commands execute real backend canister calls and report success/failure based on actual backend outcomes, with clear messages for unauthenticated/offline states.
- Update Root Terminal user-facing description/welcome/help copy to avoid implying OS-level or “full system access,” and accurately describe canister administration capabilities.

**User-visible outcome:** The terminal no longer accepts or lists fake OS/file/network commands; admin commands run real canister actions and show truthful results and guidance when backend/authentication is missing.
