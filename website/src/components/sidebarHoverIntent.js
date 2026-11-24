/**
 * Hover-intent state machine for the auto-collapsing sidebar.
 *
 * Kept pure and framework-free so the interaction rules can be unit tested
 * without a DOM. The component owns the timers; this module owns the
 * decisions, which is what actually prevents flicker:
 *
 * - `open` only after the pointer has dwelled long enough (no drive-by flashes)
 * - `close` is deferred, but re-entering during the delay cancels it
 * - a pointer that leaves during the dwell window never opens at all
 */

/** Pointer must dwell this long before the rail expands. */
export const HOVER_INTENT_MS = 90
/** Collapse delay after the pointer leaves the sidebar. */
export const COLLAPSE_DELAY_MS = 260
/** Rail hover behavior is desktop-only; ≤900px uses the drawer. */
export const RAIL_MEDIA_QUERY = '(max-width: 900px)'

export const SIDEBAR_TIMERS = {
  hoverIntent: HOVER_INTENT_MS,
  collapse: COLLAPSE_DELAY_MS,
}

/**
 * Whether the rail should currently render expanded.
 *
 * A pinned sidebar and the mobile drawer always win; otherwise hover expands it.
 */
export function isRailExpanded({ pinned, hoverExpanded, drawerOpen, railCapable }) {
  if (drawerOpen) return true
  if (!railCapable) return true
  return Boolean(pinned) || Boolean(hoverExpanded)
}

/**
 * Decide what a pointer enter should schedule.
 *
 * Returns `null` when nothing should happen (already open, pinned, or the
 * drawer is showing), otherwise the timer to schedule.
 */
export function onPointerEnter({ pinned, hoverExpanded, drawerOpen, railCapable }) {
  if (!railCapable || pinned || drawerOpen) return null
  if (hoverExpanded) return null
  return { openAfter: HOVER_INTENT_MS }
}

/**
 * Decide what a pointer leave should schedule.
 *
 * Returns `null` when there is nothing to collapse.
 */
export function onPointerLeave({ pinned, hoverExpanded, drawerOpen, railCapable }) {
  if (!railCapable || pinned || drawerOpen) return null
  if (!hoverExpanded) return null
  return { closeAfter: COLLAPSE_DELAY_MS }
}

/** Tooltips only make sense on the collapsed rail. */
export function shouldShowTooltip({ pinned, hoverExpanded, drawerOpen, railCapable }) {
  return railCapable && !drawerOpen && !pinned && !hoverExpanded
}
