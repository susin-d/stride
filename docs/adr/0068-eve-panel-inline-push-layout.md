# ADR 0068 — Eve Panel: Inline Push Layout with Drag Resize

**Status:** Accepted  
**Date:** 2026-11-25

## Context

The Eve AI assistant panel was rendered via `createPortal` onto `document.body` as a fixed-position overlay with a dimming backdrop. This meant:

- Opening Eve overlaid page content rather than pushing it aside, making it impossible to view both the page and Eve simultaneously.
- The panel had a fixed width (480px / 680px wide) with no user control over its size.
- State was local to `Header.jsx`, making it hard to coordinate with the layout shell.

Users want the panel to **push page content** (shrink the main area) and be **freely resizable** by dragging the panel's left edge.

## Decision

1. **New component `EveAssistantPanel`** (`components/EveAssistantPanel.jsx`): An inline `<aside>` placed directly in the `app-shell` flex row, not in a portal. Contains all chat logic (copied from `EveAssistantModal`). Width is controlled by an `onResize` callback via a `mousedown` drag handler on a 6px left-edge resize handle.

2. **State lifted to `AppLayout`**: `eveOpen` and `evePanelWidth` state move from `Header.jsx` to `AppLayout.jsx`. Width is persisted to `localStorage` via `EVE_PANEL_WIDTH_KEY`. Min 300px, default 480px, max 760px.

3. **`Header.jsx` receives `onEveOpen` prop**: The header button calls `onEveOpen()` up to AppLayout instead of managing its own `eveOpen` state. The old `EveAssistantModal` import is removed from Header.

4. **`EveAssistantModal` is preserved** for any other callers (workspace, studio) that may invoke it directly via portal.

5. **CSS update** (`header-eve-shell.css`): Added `.eve-assistant-panel--inline` class for in-flow positioning and `.eve-panel-resize-handle` with a visual drag grip. On ≤900px screens the inline panel reverts to a fixed overlay so mobile is unaffected.

6. **Storage key added** to `lib/storageKeys.js` as `EVE_PANEL_WIDTH_KEY = 'stride.eve-panel-width'`.

## Consequences

- **Positive:** Page and Eve chat are simultaneously visible; users choose their own split ratio; width is remembered across sessions.
- **Positive:** Keyboard-accessible resize handle (Arrow keys ±20px).
- **Neutral:** `EveAssistantModal` (portal, overlay) is kept for backward compat — it still works for the workspace-eve use case.
- **Watch:** Very narrow viewport widths collapse the main content area. The 300px minimum mitigates this; on ≤900px the panel falls back to fixed overlay.

## Alternatives Considered

- **CSS Grid split** on `app-shell`: Would require threading width as a CSS variable; the current flex approach (sibling flex children with explicit width) is simpler and self-contained.
- **Keep portal, offset page** via `padding-right` on `app-shell`: Fragile on small screens and requires careful z-index coordination. Direct flex sibling is cleaner.
