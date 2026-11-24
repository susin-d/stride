import { describe, expect, it } from 'vitest'
import {
  COLLAPSE_DELAY_MS,
  HOVER_INTENT_MS,
  isRailExpanded,
  onPointerEnter,
  onPointerLeave,
  shouldShowTooltip,
} from '../sidebarHoverIntent'

const rail = { pinned: false, hoverExpanded: false, drawerOpen: false, railCapable: true }

describe('sidebar hover intent', () => {
  it('keeps the rail collapsed by default and expands on hover', () => {
    expect(isRailExpanded(rail)).toBe(false)
    expect(isRailExpanded({ ...rail, hoverExpanded: true })).toBe(true)
  })

  it('lets an explicit pin win regardless of hover', () => {
    expect(isRailExpanded({ ...rail, pinned: true })).toBe(true)
    expect(isRailExpanded({ ...rail, pinned: true, hoverExpanded: true })).toBe(true)
  })

  it('always renders expanded on mobile (drawer owns the layout)', () => {
    expect(isRailExpanded({ ...rail, railCapable: false })).toBe(true)
    expect(isRailExpanded({ ...rail, drawerOpen: true })).toBe(true)
  })

  it('schedules a delayed open on enter, not an instant one', () => {
    expect(onPointerEnter(rail)).toEqual({ openAfter: HOVER_INTENT_MS })
    expect(HOVER_INTENT_MS).toBeGreaterThan(0)
  })

  it('does nothing on enter when already open, pinned or mobile', () => {
    expect(onPointerEnter({ ...rail, hoverExpanded: true })).toBeNull()
    expect(onPointerEnter({ ...rail, pinned: true })).toBeNull()
    expect(onPointerEnter({ ...rail, railCapable: false })).toBeNull()
  })

  it('defers collapse after leaving so re-entry does not flicker', () => {
    expect(onPointerLeave({ ...rail, hoverExpanded: true })).toEqual({
      closeAfter: COLLAPSE_DELAY_MS,
    })
    expect(COLLAPSE_DELAY_MS).toBeGreaterThan(HOVER_INTENT_MS)
  })

  it('does not schedule a collapse when already collapsed or pinned', () => {
    expect(onPointerLeave(rail)).toBeNull()
    expect(onPointerLeave({ ...rail, hoverExpanded: true, pinned: true })).toBeNull()
  })

  it('shows tooltips only while the rail is collapsed', () => {
    expect(shouldShowTooltip(rail)).toBe(true)
    expect(shouldShowTooltip({ ...rail, hoverExpanded: true })).toBe(false)
    expect(shouldShowTooltip({ ...rail, pinned: true })).toBe(false)
    expect(shouldShowTooltip({ ...rail, railCapable: false })).toBe(false)
  })
})
