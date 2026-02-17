# Specification

## Summary
**Goal:** Make the ICP Operations Console (ICP Controller experience) explicitly discoverable and allow eligible users to switch between it and the Security Dashboard without changing roles.

**Planned changes:**
- Add a clearly labeled navigation control to open the ICP Operations Console for users with the ICP Controller role (and hide it or show it disabled with an English explanation for users without the role).
- For users who have both (App Controller or Security) and ICP Controller roles, add an in-app view switcher (English-labeled) to toggle the main content between AdminDashboard and IcpOpsDashboard, with a visible selected state.
- Persist the selected view on the client for the session so refresh/navigation keeps the last selected view when allowed, and fall back safely when access rules prevent the view.

**User-visible outcome:** Users with the ICP Controller role can reliably find and open ICP Operations, and users with both access types can switch between “Security Dashboard” and “ICP Operations” without logging out or reloading, with their choice remembered during the session.
