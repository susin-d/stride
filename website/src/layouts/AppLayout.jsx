import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { MobileTabBar } from '../components/MobileTabBar'
import { NetworkStatus } from '../components/NetworkStatus'
import '../App.css'
import { EVE_PANEL_WIDTH_KEY, SIDEBAR_EXPANDED_KEY } from '../lib/storageKeys'

const EveAssistantPanel = lazy(() =>
  import('../components/EveAssistantPanel').then((m) => ({ default: m.EveAssistantPanel })),
)

const EVE_PANEL_DEFAULT_WIDTH = 480
const EVE_PANEL_MIN_WIDTH = 300
const EVE_PANEL_MAX_WIDTH = 760

export function AppLayout({
  activePage,
  children,
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
  onWorkspaceChanged,
  onEveNewChat,
  onSignOut,
  workspaceData,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // The rail starts collapsed and expands on hover; the stored flag only
  // records an explicit "pin open" choice from the toggle.
  const [sidebarExpanded, setSidebarExpanded] = useState(
    () => localStorage.getItem(SIDEBAR_EXPANDED_KEY) === 'true',
  )
  const [eveOpen, setEveOpen] = useState(false)
  const [evePanelWidth, setEvePanelWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem(EVE_PANEL_WIDTH_KEY), 10)
    return saved >= EVE_PANEL_MIN_WIDTH && saved <= EVE_PANEL_MAX_WIDTH ? saved : EVE_PANEL_DEFAULT_WIDTH
  })
  const contentRef = useRef(null)
  const isSidebarExpanded = sidebarExpanded

  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true })
  }, [activePage])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(sidebarExpanded))
  }, [sidebarExpanded])

  useEffect(() => {
    localStorage.setItem(EVE_PANEL_WIDTH_KEY, String(evePanelWidth))
  }, [evePanelWidth])

  // Listen for the global eve open event (from search palette etc.)
  useEffect(() => {
    const handleOpenEve = () => setEveOpen(true)
    window.addEventListener('stride:open-eve', handleOpenEve)
    return () => window.removeEventListener('stride:open-eve', handleOpenEve)
  }, [])

  const handleEveResize = useCallback((newWidth) => {
    const clamped = Math.min(EVE_PANEL_MAX_WIDTH, Math.max(EVE_PANEL_MIN_WIDTH, newWidth))
    setEvePanelWidth(clamped)
  }, [])

  return (
    <div className={`app-shell ${isSidebarExpanded ? 'sidebar-expanded' : ''} ${eveOpen ? 'eve-panel-open' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <NetworkStatus />
      <Sidebar
        activePage={activePage}
        isExpanded={isSidebarExpanded}
        isOpen={sidebarOpen}
        onNavigate={onNavigate}
        onClose={() => setSidebarOpen(false)}
        onToggleExpand={() => setSidebarExpanded((expanded) => !expanded)}
        onWorkspaceChanged={onWorkspaceChanged}
      />
      <div className="app-main-wrapper">
        <Header
          activePage={activePage}
          onNavigate={onNavigate}
          onCreate={onCreate}
          callCenter={callCenter}
          notifications={notifications}
          setNotifications={setNotifications}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          user={user}
          notificationsCanLoadMore={notificationsCanLoadMore}
          notificationsLoading={notificationsLoading}
          onLoadMoreNotifications={onLoadMoreNotifications}
          onWorkspaceChanged={onWorkspaceChanged}
          onEveOpen={() => setEveOpen(true)}
          onEveNewChat={onEveNewChat}
          onSignOut={onSignOut}
          workspaceData={workspaceData}
        />
        <main
          ref={contentRef}
          id="main-content"
          className={`app-main content ${activePage === 'calendar' ? 'calendar-content' : ''} ${activePage === 'whatsapp' ? 'whatsapp-fullscreen-content' : ''} ${activePage === 'workspace' ? 'workspace-fullscreen-content' : ''}`}
          tabIndex={-1}
        >
          {children}
        </main>
        <MobileTabBar activePage={activePage} onNavigate={onNavigate} />
      </div>
      {eveOpen && (
        <Suspense fallback={null}>
          <EveAssistantPanel
            onClose={() => setEveOpen(false)}
            onNavigate={onNavigate}
            onWorkspaceChanged={onWorkspaceChanged}
            width={evePanelWidth}
            onResize={handleEveResize}
            minWidth={EVE_PANEL_MIN_WIDTH}
            maxWidth={EVE_PANEL_MAX_WIDTH}
          />
        </Suspense>
      )}
    </div>
  )
}
