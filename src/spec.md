# Specification

## Summary
**Goal:** Repair frontend UI visual regressions and ensure dropdown/select menus render and behave reliably across the app in both light and dark themes.

**Planned changes:**
- Fix Select/dropdown menu rendering so menus open reliably, appear above all panels (including the sticky header), are not clipped by containers, remain clickable, and close correctly.
- Audit and repair core dashboard styling regressions (header, cards, panels, spacing, typography) to restore consistent layout and readable contrast in light/dark themes at common viewport sizes.
- Repair Network Map presentation so the canvas boundary is clear and nodes/edges/labels are legible in light/dark themes, with at least one node visible when node counters indicate 1+.
- Fix tab-like navigation controls (e.g., ICP Controls Catalog category tabs) to prevent overlap/overflow, clearly show active state, and remain usable on smaller screens.

**User-visible outcome:** Dropdowns and tabs work consistently without clipping or layering issues, dashboards look readable and aligned, and the Network Map is visible and legible in both light and dark themes.
