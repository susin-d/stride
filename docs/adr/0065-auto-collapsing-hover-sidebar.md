# ADR 0065 — Auto-collapsing, hover-expandable sidebar rail

## Status

Accepted

- Date: 2026-11-24
- Deciders: @susindran
- Tags: `frontend`, `layout`, `navigation`, `interaction`

## Context

The sidebar was a flex sibling of the main content: `flex: 0 0 var(--sidebar-collapsed)` plus a `flex-basis` transition to `--sidebar-expanded`. Two problems followed.

1. **Layout shift.** Animating `flex-basis` re-laid out the entire flex row, so every hover/pin reflowed and repainted the whole page — visible jank on content-heavy pages (Workspace, WhatsApp, Mail).
2. **Flicker-prone state.** Expansion was a single `expanded` boolean persisted to `localStorage` and toggled only by an explicit click. Labels were hidden with `display: none`, which cannot animate, so the collapse snapped. Any hover-driven behavior added on top would have flashed on every pointer crossing the rail.

The goal is to maximise content width while keeping navigation one hover away.

## Decision

Make the sidebar a **fixed-width rail that grows as an overlay**, and drive expansion from hover intent resolved by pure, testable logic.

- **No layout shift:** `.sidebar` keeps `flex: 0 0 var(--sidebar-collapsed)` permanently; only `width` transitions. The expanded rail overlaps the content instead of shrinking it (`z-index: 50`), so nothing below reflows.
- **Pinned vs hover state:** `railExpanded = drawerOpen || !railCapable || pinned || hoverExpanded`. The persisted `stride.sidebar-expanded` flag now records only an explicit *pin*; the rail defaults to collapsed on first load.
- **Hover intent module:** `website/src/components/sidebarHoverIntent.js` owns the constants and decisions — `HOVER_INTENT_MS` 90 (no drive-by flashes), `COLLAPSE_DELAY_MS` 260 (grace so the pointer can return), `shouldShowTooltip`, and `isRailExpanded`. `Sidebar.jsx` owns only the timers, so the rules are unit-testable without a DOM (the repo has no jsdom/RTL, and adding dependencies needs approval).
- **Animation:** labels/group headers animate via opacity/transform/max-height instead of `display: none`; widths use `cubic-bezier(0.32, 0.72, 0, 1)` at 240ms; labels stagger in by 40–70ms so the rail settles before text lands.
- **Active state in both modes:** filled tile + label when expanded (plus a dot), and an inset bar drawn *inside* the clipped tile when collapsed (overflow clips anything outside).
- **Tooltips** render from the resting rail only, anchored at `calc(var(--sidebar-collapsed) + var(--space-2xs))` so they never drift during the width transition.
- **Mobile unchanged:** ≤900px keeps the drawer + `MobileTabBar`; hover is disabled via `matchMedia` and `onTouchStart` clears hover state.

## Consequences

- **Positive:** hovering the rail never moves page content; the collapse delay removes flicker; the interaction rule is covered by 8 unit tests.
- **Negative / Cost:** the expanded rail covers the left edge of the page while open, so a link under it is briefly unclickable — acceptable because content is only covered while the pointer is on the rail. Pages that position a sub-sidebar (`mail-folders.css`) must key off the pinned class, which they already do.
- **Follow-up:** if keyboard users need a wider default, tune `HOVER_INTENT_MS`/`COLLAPSE_DELAY_MS` rather than reintroducing a persisted expanded default.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep animating `flex-basis` and just add hover | Still reflows the whole row on every hover; the jank was the original complaint. |
| Pure CSS `:hover` expansion | No collapse delay, so crossing the rail flickers; cannot respect a pinned state or touch input. |
| Overlay panel pinned always-open | Wastes horizontal space on wide pages — the reason for a rail. |
| Do nothing | Content width and hover accessibility both stay compromised. |

## References

- `website/src/components/Sidebar.jsx`, `website/src/components/sidebarHoverIntent.js`
- `website/src/styles/components/sidebar.css`, `website/src/layouts/AppLayout.jsx`
- `website/src/components/__tests__/sidebarHoverIntent.test.js`
