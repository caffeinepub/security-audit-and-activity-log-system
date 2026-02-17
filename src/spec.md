# Specification

## Summary
**Goal:** Clarify in-app that “Web control” / “World Wide Web Controller” is not a supported role, and guide users to request the supported roles via the correct process.

**Planned changes:**
- Update the Roles & Access panel copy to explicitly state that “Web control” / “World Wide Web Controller” is not a role in this app and that only App Controller, Security, and ICP Controller exist.
- Add clear next-step guidance in the Roles & Access panel instructing users to share their Principal ID with the App Controller to request Security (security/audit features) or ICP Controller (ICP operations).
- Update the Access Denied screen copy for authenticated-but-unauthorized users to note that “Web control” cannot be granted because it’s not supported, while continuing to show the user’s Principal ID and one-click copy and recommending requesting Security or ICP Controller from the App Controller.

**User-visible outcome:** Users who ask for “Web control” see clear English guidance that the role does not exist here, see the list of supported roles, and are instructed to copy/share their Principal ID with the App Controller to request Security or ICP Controller access.
