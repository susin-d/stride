import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Clock, CornerDownLeft, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useSearchPalette } from './useSearchPalette'

export function AdvancedSearchModal({
  isOpen,
  onClose,
  onNavigate,
  onCreate,
  callCenter,
  toggleTheme,
  setDarkTheme,
  setEveOpen,
  setNotificationsOpen,
  onEveNewChat,
  onSignOut,
  workspaceData = {},
  initialQuery = '',
}) {
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const {
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    recentSearches,
    clearRecentSearches,
    fullIndex,
    filteredItems,
    groupedResults,
    handleSelectItem,
    handleKeyDown,
  } = useSearchPalette({
    isOpen,
    onClose,
    onNavigate,
    onCreate,
    callCenter,
    toggleTheme,
    setDarkTheme,
    setEveOpen,
    setNotificationsOpen,
    onEveNewChat,
    onSignOut,
    workspaceData,
    initialQuery,
    inputRef,
    listRef,
  })

  if (!isOpen) return null

  let runningIndex = -1

  return createPortal(
    <div className="search-palette-backdrop" onMouseDown={onClose} role="presentation">
      <div
        className="search-palette-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette and advanced search"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="search-palette-header">
          <Search size={19} className="search-palette-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="search-palette-input"
            placeholder="Search any page, section, record, or command…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search query"
          />
          {query && (
            <button
              type="button"
              className="search-palette-clear"
              onClick={() => {
                setQuery('')
                setActiveIndex(0)
                inputRef.current?.focus()
              }}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <button
            type="button"
            className="search-palette-close"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close search"
          >
            <kbd>Esc</kbd>
          </button>
        </div>

        <div className="search-palette-body" ref={listRef}>
          {!query && recentSearches.length > 0 && (
            <div className="search-palette-recents">
              <div className="search-palette-recents-header">
                <span>
                  <Clock size={13} />
                  Recent Pages
                </span>
                <button
                  type="button"
                  className="search-palette-recents-clear"
                  onClick={clearRecentSearches}
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              </div>
              <div className="search-palette-recents-chips">
                {recentSearches.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    className="search-palette-recent-chip"
                    onClick={() => {
                      const found = fullIndex.find((i) => i.id === rec.id)
                      if (found) handleSelectItem(found)
                      else setQuery(rec.title)
                    }}
                  >
                    <span>{rec.title}</span>
                    <ArrowRight size={11} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="search-palette-empty">
              <Search size={28} className="empty-icon" />
              <p className="empty-title">No matching results</p>
              <p className="empty-subtitle">
                No section, page, or record matched &ldquo;<strong>{query}</strong>&rdquo;. Try searching for &ldquo;profile&rdquo;, &ldquo;ai models&rdquo;, &ldquo;projects&rdquo;, or &ldquo;tasks&rdquo;.
              </p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([groupName, items]) => (
              <div key={groupName} className="search-palette-group">
                <div className="search-palette-group-title">{groupName}</div>
                <div className="search-palette-group-items">
                  {items.map((item) => {
                    runningIndex += 1
                    const itemIndex = runningIndex
                    const isActive = itemIndex === activeIndex
                    const IconComponent = item.icon || Sparkles

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-item-index={itemIndex}
                        className={`search-palette-item ${isActive ? 'active' : ''}`}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => handleSelectItem(item)}
                      >
                        <span className="search-palette-item-icon">
                          <IconComponent size={16} />
                        </span>
                        <div className="search-palette-item-info">
                          <div className="search-palette-item-title-row">
                            <span className="search-palette-item-title">{item.title}</span>
                            {item.badge && (
                              <span className="search-palette-item-badge">{item.badge}</span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="search-palette-item-subtitle">{item.subtitle}</p>
                          )}
                        </div>
                        {isActive && (
                          <span className="search-palette-item-enter">
                            <CornerDownLeft size={13} />
                            <span>Select</span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="search-palette-footer">
          <div className="search-palette-footer-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> <span>Navigate</span>
          </div>
          <div className="search-palette-footer-hint">
            <kbd>↵</kbd> <span>Select</span>
          </div>
          <div className="search-palette-footer-hint">
            <kbd>Esc</kbd> <span>Close</span>
          </div>
          <div className="search-palette-footer-badge">Stride Command Palette</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
