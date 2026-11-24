import { useCallback, useEffect, useRef, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { getGroupModuleKey, navigationItems } from '../config/navigation'
import { StrideLogo } from './StrideLogo'
import {
  RAIL_MEDIA_QUERY,
  SIDEBAR_TIMERS,
  isRailExpanded,
  onPointerEnter as resolveEnter,
  onPointerLeave as resolveLeave,
  shouldShowTooltip,
} from './sidebarHoverIntent'

function useRailCapable() {
  const [railCapable, setRailCapable] = useState(() =>
    typeof window === 'undefined' ? true : !window.matchMedia(RAIL_MEDIA_QUERY).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(RAIL_MEDIA_QUERY)
    const update = () => setRailCapable(!query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return railCapable
}

export function Sidebar({
  activePage,
  isExpanded,
  isOpen,
  onClose,
  onNavigate,
  onToggleExpand,
}) {
  const sidebarRef = useRef(null)
  const hoverTimerRef = useRef(null)
  const collapseTimerRef = useRef(null)
  // True while the pointer is resting on the sidebar; cleared on leave/touch.
  const hoverIntentRef = useRef(false)
  const railCapable = useRailCapable()
  const [hoveredItem, setHoveredItem] = useState(null)
  // Hover-driven expansion of the collapsed rail. Independent of the pin.
  const [isHoverExpanded, setIsHoverExpanded] = useState(false)

  const navigationGroups = Array.from(new Set(navigationItems.map(({ group }) => group)))

  const railState = { pinned: isExpanded, hoverExpanded: isHoverExpanded, drawerOpen: isOpen, railCapable }
  const expanded = isRailExpanded(railState)

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
  }, [])

  const collapseNow = useCallback(() => {
    clearHoverTimer()
    clearCollapseTimer()
    hoverIntentRef.current = false
    setIsHoverExpanded(false)
    setHoveredItem(null)
  }, [clearHoverTimer, clearCollapseTimer])

  useEffect(() => () => {
    clearHoverTimer()
    clearCollapseTimer()
  }, [clearHoverTimer, clearCollapseTimer])

  // A pinned-open sidebar is already expanded; never keep a stale hover state.
  useEffect(() => {
    if (isExpanded) setIsHoverExpanded(false)
  }, [isExpanded])

  const handlePointerEnter = () => {
    const intent = resolveEnter(railState)
    if (!intent) return
    hoverIntentRef.current = true
    clearCollapseTimer()
    if (!isHoverExpanded) clearHoverTimer()
    // Dwell briefly so a pointer merely crossing the rail does not flash it open.
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null
      // Guard: the pointer may have left during the dwell window.
      if (hoverIntentRef.current) setIsHoverExpanded(true)
    }, intent.openAfter)
  }

  const handlePointerLeave = () => {
    setHoveredItem(null)
    hoverIntentRef.current = false
    clearHoverTimer()
    const intent = resolveLeave(railState)
    if (!intent) return
    // Grace delay: lets the pointer travel back in without collapsing.
    clearCollapseTimer()
    collapseTimerRef.current = window.setTimeout(() => {
      collapseTimerRef.current = null
      setIsHoverExpanded(false)
    }, intent.closeAfter)
  }

  const handleBlurCapture = (event) => {
    // Keyboard users leaving the sidebar should get the collapsed rail back too,
    // unless the pointer is still hovering inside the sidebar.
    if (sidebarRef.current?.contains(event.relatedTarget)) return
    if (hoverIntentRef.current) return
    if (!isHoverExpanded) return
    clearCollapseTimer()
    collapseTimerRef.current = window.setTimeout(() => {
      collapseTimerRef.current = null
      setIsHoverExpanded(false)
    }, SIDEBAR_TIMERS.collapse)
  }

  const handleNavigate = (page) => {
    onNavigate(page)
    onClose()
    setHoveredItem(null)
  }

  const handleToggleExpand = () => {
    collapseNow()
    onToggleExpand()
  }

  // Tooltip pills are only useful on the collapsed rail.
  const showTooltip = (event, label) => {
    if (!shouldShowTooltip(railState)) return
    const rect = event.currentTarget.getBoundingClientRect()
    setHoveredItem({ label, top: rect.top + rect.height / 2 })
  }

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`sidebar ${expanded ? 'expanded' : ''} ${isHoverExpanded ? 'is-previewing' : ''} ${isOpen ? 'open' : ''}`}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onFocus={clearCollapseTimer}
        onTouchStart={collapseNow}
        onScroll={() => setHoveredItem(null)}
        onBlurCapture={handleBlurCapture}
      >
        <div className="sidebar-header-row">
          <div
            className="sidebar-brand"
            onClick={expanded ? () => handleNavigate('dashboard') : handleToggleExpand}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && (expanded ? handleNavigate('dashboard') : handleToggleExpand())}
            title={expanded ? 'Stride Dashboard' : 'Expand navigation'}
            aria-label={expanded ? 'Stride Dashboard' : 'Expand navigation'}
          >
            <StrideLogo size={28} />
            <span className="sidebar-brand-name">Stride</span>
          </div>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={handleToggleExpand}
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={expanded}
            title={expanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          {isOpen && (
            <button
              type="button"
              className="close-button"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav aria-label="Main navigation">
          {navigationGroups.map((group) => (
            <div className="sidebar-nav-group" key={group} data-group={getGroupModuleKey(group)}>
              <span className="sidebar-nav-group-label" aria-hidden="true">{group}</span>
              {navigationItems
                .filter((item) => item.group === group)
                .map(({ id, label, icon: Icon, module: itemModule }) => {
                  const isActive = activePage === id
                  return (
                    <button
                      key={id}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      data-module={itemModule || id}
                      onClick={() => handleNavigate(id)}
                      onMouseEnter={(e) => showTooltip(e, label)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onFocus={(e) => showTooltip(e, label)}
                      onBlur={() => setHoveredItem(null)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={label}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span className="nav-item-label">{label}</span>
                      {isActive && <span className="nav-item-active-dot" aria-hidden="true" />}
                    </button>
                  )
                })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-footer-toggle"
            onClick={handleToggleExpand}
            onMouseEnter={(e) => showTooltip(e, isExpanded ? 'Collapse navigation' : 'Pin navigation open')}
            onMouseLeave={() => setHoveredItem(null)}
            onFocus={(e) => showTooltip(e, isExpanded ? 'Collapse navigation' : 'Pin navigation open')}
            onBlur={() => setHoveredItem(null)}
            aria-label={isExpanded ? 'Collapse navigation' : 'Pin navigation open'}
            aria-expanded={expanded}
            aria-pressed={isExpanded}
          >
            {isExpanded ? <PanelLeftClose size={18} aria-hidden="true" /> : <PanelLeftOpen size={18} aria-hidden="true" />}
            <span className="sidebar-footer-label">{isExpanded ? 'Collapse' : 'Pin open'}</span>
          </button>
        </div>
      </aside>

      {!expanded && hoveredItem && (
        <div
          className="sidebar-tooltip-pill"
          style={{ top: `${hoveredItem.top}px` }}
          role="tooltip"
        >
          {hoveredItem.label}
        </div>
      )}

      {isOpen && (
        <button
          className="backdrop"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
    </>
  )
}
