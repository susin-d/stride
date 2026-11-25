import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare2,
  FolderKanban,
  Gauge,
  Rocket,
  Trophy,
} from 'lucide-react'
import { DASHBOARD_KEY } from '../lib/storageKeys'

export const DASHBOARD_STORAGE_KEY = DASHBOARD_KEY
export const DASHBOARD_SCHEMA_VERSION = 3

export const dashboardWidgets = [
  { id: 'today', title: 'Today', icon: Gauge, destination: 'calendar', section: 'focus' },
  { id: 'todo', title: 'Tasks', icon: CheckSquare2, destination: 'todo', section: 'focus' },
  { id: 'projects', title: 'Projects', icon: FolderKanban, destination: 'projects', section: 'main' },
  { id: 'calendar', title: 'Upcoming', icon: CalendarDays, destination: 'calendar', section: 'main' },
  { id: 'jobs', title: 'Applications', icon: BriefcaseBusiness, destination: 'jobs', section: 'rail' },
  { id: 'competitive-coding', title: 'Contests', icon: Trophy, destination: 'compete', section: 'rail' },
  { id: 'hackathons', title: 'Hackathons', icon: Rocket, destination: 'hackathons', section: 'rail' },
  { id: 'documents', title: 'Activity', icon: Activity, destination: 'documents', section: 'rail' },
  { id: 'notifications', title: 'Alerts', icon: Bell, destination: null, section: 'rail' },
]

export const DASHBOARD_SECTIONS = [
  { id: 'focus', label: 'Focus' },
  { id: 'main', label: 'Work & Schedule' },
  { id: 'rail', label: 'Radar & Activity' },
]

export function loadDashboardPreferences() {
  const fallback = {
    version: DASHBOARD_SCHEMA_VERSION,
    hiddenWidgetIds: [],
    density: 'balanced',
  }

  try {
    const stored = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY))
    if (!stored || typeof stored !== 'object') return fallback
    const validIds = new Set(dashboardWidgets.map(({ id }) => id))

    return {
      version: DASHBOARD_SCHEMA_VERSION,
      hiddenWidgetIds: Array.isArray(stored.hiddenWidgetIds)
        ? stored.hiddenWidgetIds.filter((id) => validIds.has(id))
        : [],
      density: ['compact', 'balanced', 'spacious'].includes(stored.density)
        ? stored.density
        : 'balanced',
    }
  } catch {
    return fallback
  }
}
