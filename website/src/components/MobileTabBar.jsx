import { Bot, LayoutDashboard, Search, UserRound } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: '__search', label: 'Search', icon: Search },
  { id: 'eve', label: 'Eve', icon: Bot },
  { id: 'profile', label: 'You', icon: UserRound },
]

function isTabActive(tabId, activePage) {
  if (tabId === 'eve') return activePage === 'eve' || activePage.startsWith('eve-')
  return activePage === tabId
}

export function MobileTabBar({ activePage, onNavigate }) {
  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('stride:open-search'))
  }

  return (
    <nav className="mobile-tabbar" aria-label="Primary">
      {TABS.map(({ id, label, icon: Icon }) => {
        if (id === '__search') {
          return (
            <button key={id} type="button" onClick={openSearch} aria-label="Search (Ctrl K)">
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        }
        const active = isTabActive(id, activePage ?? '')
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={active ? 'page' : undefined}
            className={active ? 'is-active' : undefined}
            data-module={id === 'eve' ? 'eve' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
