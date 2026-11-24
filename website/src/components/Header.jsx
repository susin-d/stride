import { lazy, Suspense, useEffect, useState } from 'react'
import { Bell, Bot, Search } from 'lucide-react'
import { clearAuthSession } from '../lib/authApi'
import { getNotificationPermission, requestNotificationPermission } from '../utils/browserNotifications'
import { navigationItems } from '../config/navigation'
import { applyTheme } from '../themes/themeApplicator'
import { CUSTOM_THEME_KEY } from '../lib/storageKeys'
import { NotificationsPopover } from './header/NotificationsPopover'
import { ProfileMenu } from './header/ProfileMenu'

// Interaction-only modals — fetched on first open so the search index,
// Eve modal, and Markdown renderer stay out of the initial shell.
const AdvancedSearchModal = lazy(() => import('./search/AdvancedSearchModal').then((m) => ({ default: m.AdvancedSearchModal })))

export function Header({
  activePage,
  onNavigate,
  onCreate,
  callCenter,
  notifications,
  setNotifications,
  notificationsOpen,
  setNotificationsOpen,
  user,
  notificationsCanLoadMore,
  notificationsLoading,
  onLoadMoreNotifications,
  onEveOpen,
  onEveNewChat,
  onSignOut,
  workspaceData,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState(() => getNotificationPermission())

  const handleSignOut = () => {
    setProfileMenuOpen(false)
    if (onSignOut) onSignOut()
    else clearAuthSession()
  }

  const handleToggleNotifications = () => {
    if (!notificationsOpen && getNotificationPermission() === 'default') {
      requestNotificationPermission()
        .then((res) => setPermissionStatus(res))
        .catch(() => setPermissionStatus(getNotificationPermission()))
    } else {
      setPermissionStatus(getNotificationPermission())
    }
    setNotificationsOpen((current) => !current)
  }

  const handleRequestPermission = async () => {
    try {
      const res = await requestNotificationPermission()
      setPermissionStatus(res)
    } catch {
      setPermissionStatus(getNotificationPermission())
    }
  }

  const unreadCount = (notifications || []).filter((n) => n.unread).length

  const handleToggleTheme = () => {
    const nextMode = document.documentElement.classList.contains('dark-theme') ? 'light' : 'dark'
    let currentConfig = {}
    try {
      const saved = localStorage.getItem(CUSTOM_THEME_KEY)
      if (saved) currentConfig = JSON.parse(saved) || {}
    } catch {
      /* corrupt entry — a fresh appearance object is written below */
    }
    const nextState = { ...currentConfig, mode: nextMode }
    applyTheme(nextState)
    try {
      localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(nextState))
    } catch {
      /* storage unavailable — the applied mode still holds for this session */
    }
    window.dispatchEvent(new CustomEvent('stride:theme-change', { detail: nextState }))
  }

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    const handleOpenSearchEvent = () => setSearchOpen(true)

    document.addEventListener('keydown', handleShortcut)
    window.addEventListener('stride:open-search', handleOpenSearchEvent)
    return () => {
      document.removeEventListener('keydown', handleShortcut)
      window.removeEventListener('stride:open-search', handleOpenSearchEvent)
    }
  }, [setNotificationsOpen])

  const navigateFromMenu = (page) => {
    onNavigate(page)
    setProfileMenuOpen(false)
  }

  const currentNav = navigationItems.find((item) => item.id === activePage) || {
    label: activePage ? activePage.charAt(0).toUpperCase() + activePage.slice(1) : 'Dashboard',
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-page-title" aria-current="page">{currentNav.label}</span>
        </div>

        <div className="header-actions">
          <div className="search-container">
            <button
              type="button"
              className="search header-search-trigger"
              onClick={() => setSearchOpen(true)}
              aria-label="Search any section, page, or record (⌘K)"
            >
              <Search size={16} />
              <span className="search-placeholder">Search any section…</span>
              <kbd>⌘ K</kbd>
            </button>
          </div>
          <button
            className="eve-button"
            type="button"
            onClick={() => onEveOpen?.()}
            aria-label="Open Eve AI assistant"
          >
            <Bot size={17} />
            <span>Eve</span>
          </button>
          <button
            className="icon-button notification-button"
            type="button"
            aria-label={`${unreadCount} unread notifications`}
            aria-expanded={notificationsOpen}
            onClick={handleToggleNotifications}
          >
            <Bell size={19} />
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
          <ProfileMenu
            user={user}
            isOpen={profileMenuOpen}
            onToggle={() => setProfileMenuOpen((open) => !open)}
            onNavigate={navigateFromMenu}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      <NotificationsPopover
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        unreadCount={unreadCount}
        permissionStatus={permissionStatus}
        onRequestPermission={handleRequestPermission}
        onNavigate={onNavigate}
        canLoadMore={notificationsCanLoadMore}
        loading={notificationsLoading}
        onLoadMore={onLoadMoreNotifications}
      />

      {searchOpen && (
        <Suspense fallback={null}>
          <AdvancedSearchModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onNavigate={onNavigate}
            onCreate={onCreate}
            callCenter={callCenter}
            toggleTheme={handleToggleTheme}
            setDarkTheme={handleToggleTheme}
            setEveOpen={onEveOpen}
            setNotificationsOpen={setNotificationsOpen}
            onEveNewChat={onEveNewChat}
            onSignOut={handleSignOut}
            workspaceData={workspaceData}
          />
        </Suspense>
      )}
    </>
  )
}
