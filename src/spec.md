# Specification

## Summary
**Goal:** Make ICP target changes (network/canister ID) reliably rewire the backend actor and Network Graph data fetching so the Network Map loads correctly without refresh, with clearer error guidance and retry.

**Planned changes:**
- Key backend actor creation and React Query caching by the effective ICP target settings (at minimum: network and canisterId) so changing ICP Controls re-creates/reuses the correct actor per target.
- Make the Network Graph query key target-aware (at minimum: network and canisterId) so cached successes/errors don’t leak across targets and switching targets triggers a fresh fetch.
- Improve Network Map load-failure UX to clearly indicate target/connectivity issues when possible, show the effective network + canister ID, and provide a one-click Retry that re-attempts after reconnection.
- Disable Network Graph fetching when the effective canister ID is missing/invalid/placeholder and show an English guidance message to set a valid canister ID in ICP Controls; enable fetching once valid.

**User-visible outcome:** Switching ICP Controls network/canister updates the connection and Network Graph immediately (no refresh), errors clearly show which target is unreachable and why, invalid canister IDs prompt the user to fix settings, and a Retry button re-attempts loading the graph.
