import '../styles/pages/dashboard.css'
import '../styles/pages/dashboard-customize.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  LayoutGrid,
  Plus,
  SlidersHorizontal,
} from 'lucide-react'
import { EmptyState } from '../components/ui'
import {
  DASHBOARD_SCHEMA_VERSION,
  DASHBOARD_STORAGE_KEY,
  dashboardWidgets,
  loadDashboardPreferences,
} from '../dashboard/dashboardConfig'
import { calendarDateKey } from '../utils/calendarEvents'
import { RecordList, WidgetCard } from './dashboard/WidgetCard'
import { TodoWidget } from './dashboard/TodoWidget'
import { DashboardCustomizePanel } from './dashboard/DashboardCustomizePanel'

const formatDate = (value, options = {}) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...options,
  })

const calendarEventDestinations = {
  task: 'todo',
  contest: 'compete',
  hackathon: 'hackathons',
  project: 'projects',
  job: 'jobs',
  'google-calendar': 'calendar',
  'ics-calendar': 'calendar',
}

export function DashboardPage({
  tasks,
  setTasks,
  projects,
  jobs,
  documents,
  contestSites,
  hackathons,
  notifications,
  calendarEventIndex,
  onNavigate,
  onCreate,
  onOpenNotifications,
}) {
  const initial = useMemo(() => loadDashboardPreferences(), [])
  const [hiddenWidgetIds, setHiddenWidgetIds] = useState(initial.hiddenWidgetIds)
  const [density, setDensity] = useState(initial.density)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const createRef = useRef(null)

  const todayKey = calendarDateKey(new Date())
  const todayEvents = calendarEventIndex.get(todayKey) ?? []
  const openTasksCount = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks],
  )
  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications],
  )

  const upcomingEvents = useMemo(
    () =>
      [...calendarEventIndex.entries()]
        .filter(([date]) => date >= todayKey)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([date, events]) =>
          events.map((event) => ({
            id: `${date}-${event.id}`,
            title: event.label,
            meta: formatDate(`${date}T12:00:00`),
            badge: event.type,
          })),
        ),
    [calendarEventIndex, todayKey],
  )

  const contests = useMemo(
    () =>
      contestSites
        .flatMap((site) =>
          site.contests.map((contest) => ({ ...contest, site: site.name })),
        )
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    [contestSites],
  )

  const activityFeed = useMemo(() => {
    const entries = [
      ...documents.map((document) => ({
        id: `document-${document.id}`,
        title: document.name,
        meta: `${document.type} · ${document.size}`,
        date: document.modifiedAt,
        destination: 'documents',
      })),
      ...projects.map((project) => ({
        id: `project-${project.id}`,
        title: project.name,
        meta: `Project · ${project.progress}%`,
        date: project.updatedAt,
        destination: 'project-detail',
        destinationId: project.id,
      })),
      ...jobs.map((job) => ({
        id: `job-${job.id}`,
        title: job.role,
        meta: job.company,
        date: job.appliedDate,
        destination: 'jobs',
      })),
    ]
    return entries
      .filter(({ date }) => date && !Number.isNaN(new Date(date).getTime()))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4)
      .map(({ date, ...entry }) => ({ ...entry, badge: formatDate(date) }))
  }, [documents, projects, jobs])

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(timer)
  }, [])

  const greetingHour = now.getHours()
  const greeting =
    greetingHour < 5
      ? 'Up late'
      : greetingHour < 12
        ? 'Good morning'
        : greetingHour < 17
          ? 'Good afternoon'
          : greetingHour < 22
            ? 'Good evening'
            : 'Good night'
  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  useEffect(() => {
    localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify({
        version: DASHBOARD_SCHEMA_VERSION,
        hiddenWidgetIds,
        density,
      }),
    )
  }, [hiddenWidgetIds, density])

  useEffect(() => {
    const closeMenu = (event) => {
      if (!createRef.current?.contains(event.target)) setCreateOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const toggleWidget = (id) => {
    setHiddenWidgetIds((current) =>
      current.includes(id)
        ? current.filter((widgetId) => widgetId !== id)
        : [...current, id],
    )
  }

  const resetDashboard = () => {
    setHiddenWidgetIds([])
    setDensity('balanced')
  }

  const createAction = (type) => {
    setCreateOpen(false)
    if (type === 'calendar') onNavigate('calendar')
    else onCreate(type)
  }

  const widgetContent = {
    today: {
      total: todayEvents.length,
      body: (
        <RecordList
          items={todayEvents.slice(0, 4).map((event) => ({
            id: event.id,
            title: event.label,
            badge: event.type,
            destination: calendarEventDestinations[event.type] ?? 'calendar',
          }))}
          empty="Your day is clear."
          onNavigate={onNavigate}
        />
      ),
    },
    todo: {
      total: openTasksCount,
      body: (
        <TodoWidget
          tasks={tasks}
          setTasks={setTasks}
          formatDate={formatDate}
        />
      ),
    },
    projects: {
      total: projects.length,
      body: projects.length ? (
        <div className="dashboard-project-list">
          {projects.slice(0, 4).map((project) => (
            <div key={project.id} className="dashboard-project-item">
              <div className="dashboard-project-info">
                <button
                  className="dashboard-project-name"
                  type="button"
                  onClick={() => onNavigate('project-detail', project.id)}
                >
                  <strong>{project.name}</strong>
                </button>
                <span className="dashboard-project-percent">{project.progress}%</span>
              </div>
              <div className="dashboard-project-bar-track">
                <div
                  className="dashboard-project-bar-fill"
                  style={{ '--progress': `${project.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="dashboard-widget-empty">No active projects.</p>
      ),
    },
    calendar: {
      total: upcomingEvents.length,
      body: (
        <RecordList
          items={upcomingEvents.slice(0, 4).map((event) => ({
            ...event,
            destination: calendarEventDestinations[event.badge] ?? 'calendar',
          }))}
          empty="No upcoming events."
          onNavigate={onNavigate}
        />
      ),
    },
    jobs: {
      total: jobs.length,
      body: (
        <RecordList
          items={jobs.slice(0, 3).map((job) => ({
            id: job.id,
            title: job.role,
            meta: job.company,
            badge: job.status,
            destination: 'jobs',
          }))}
          empty="No active applications."
          onNavigate={onNavigate}
        />
      ),
    },
    'competitive-coding': {
      total: contests.length,
      body: (
        <RecordList
          items={contests.slice(0, 3).map((contest) => ({
            id: contest.id,
            title: contest.name,
            meta: contest.site,
            badge: formatDate(contest.startsAt),
            destination: 'compete',
          }))}
          empty="No upcoming contests."
          onNavigate={onNavigate}
        />
      ),
    },
    hackathons: {
      total: hackathons.length,
      body: (
        <RecordList
          items={hackathons.slice(0, 3).map((hackathon) => ({
            id: hackathon.id,
            title: hackathon.title,
            meta: hackathon.organizer,
            badge: formatDate(hackathon.startsAt),
            destination: 'hackathon-detail',
            destinationId: hackathon.id,
          }))}
          empty="No tracked hackathons."
          onNavigate={onNavigate}
        />
      ),
    },
    documents: {
      body: (
        <RecordList
          items={activityFeed}
          empty="No recent activity."
          onNavigate={onNavigate}
        />
      ),
    },
    notifications: {
      total: unreadCount,
      body: (
        <RecordList
          items={notifications.slice(0, 3).map((notification) => ({
            id: notification.id,
            title: notification.title,
            meta: notification.time,
            badge: notification.unread ? 'new' : '',
            notification: true,
          }))}
          empty="You're all caught up."
          onOpenNotifications={onOpenNotifications}
        />
      ),
    },
  }

  const visibleBySection = (section) =>
    dashboardWidgets.filter(
      (widget) =>
        widget.section === section && !hiddenWidgetIds.includes(widget.id),
    )

  const focusWidgets = visibleBySection('focus')
  const mainWidgets = visibleBySection('main')
  const railWidgets = visibleBySection('rail')
  const hasVisibleWidgets =
    focusWidgets.length > 0 || mainWidgets.length > 0 || railWidgets.length > 0

  const renderWidget = (definition, spanClass = '') => (
    <WidgetCard
      key={definition.id}
      definition={definition}
      className={spanClass}
      total={widgetContent[definition.id].total}
      onOpen={() =>
        definition.id === 'notifications'
          ? onOpenNotifications()
          : onNavigate(definition.destination)
      }
    >
      {widgetContent[definition.id].body}
    </WidgetCard>
  )

  const pulseMetrics = [
    { label: 'Open tasks', value: openTasksCount, action: () => onNavigate('todo') },
    { label: "Today's events", value: todayEvents.length, action: () => onNavigate('calendar') },
    { label: 'Active projects', value: projects.length, action: () => onNavigate('projects') },
    { label: 'Unread alerts', value: unreadCount, action: onOpenNotifications },
  ]

  return (
    <div className={`dashboard-page dashboard-density-${density}`}>
      <header className="dashboard-heading">
        <div className="dashboard-greeting">
          <h1>{greeting}.</h1>
          <p className="dashboard-date">{todayLabel} · {timeLabel}</p>
        </div>
        <div className="dashboard-heading-actions dashboard-inline-actions">
          <button className="secondary-button" type="button" onClick={() => setCustomizeOpen(true)}>
            <SlidersHorizontal size={16} /> Customize
          </button>
          <div className="dashboard-create" ref={createRef}>
            <button className="primary-button" type="button" onClick={() => setCreateOpen((open) => !open)}>
              <Plus size={17} /> Create new <ChevronDown size={15} />
            </button>
            {createOpen && (
              <div className="dashboard-create-menu">
                <button type="button" onClick={() => createAction('todo')}>Add Todo</button>
                <button type="button" onClick={() => createAction('job')}>Add Job</button>
                <button type="button" onClick={() => createAction('document')}>Upload Document</button>
                <button type="button" onClick={() => createAction('calendar')}>Open Calendar</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="dashboard-pulse" aria-label="Workspace summary">
        {pulseMetrics.map((metric) => (
          <button
            key={metric.label}
            type="button"
            className="dashboard-pulse-item"
            onClick={metric.action}
          >
            <span className="dashboard-pulse-value">{metric.value}</span>
            <span className="dashboard-pulse-label">{metric.label}</span>
          </button>
        ))}
      </section>

      {!hasVisibleWidgets ? (
        <EmptyState
          icon={LayoutGrid}
          title="All dashboard cards are hidden"
          description="Restore the default cards or customize which widgets appear here."
          action={
            <button type="button" className="secondary-button" onClick={resetDashboard}>
              Restore default cards
            </button>
          }
        />
      ) : (
        <div className="dashboard-bento">
          {focusWidgets.length > 0 && (
            <section
              className={`dashboard-band dashboard-band-focus ${focusWidgets.length === 1 ? 'is-single' : ''}`}
              aria-label="Today's focus"
            >
              {focusWidgets.map((definition) =>
                renderWidget(
                  definition,
                  definition.id === 'todo' ? 'dashboard-span-wide' : 'dashboard-span-narrow',
                ),
              )}
            </section>
          )}

          {mainWidgets.length > 0 && (
            <section
              className={`dashboard-band dashboard-band-main ${mainWidgets.length === 1 ? 'is-single' : ''}`}
              aria-label="Work and schedule"
            >
              {mainWidgets.map((definition) =>
                renderWidget(
                  definition,
                  definition.id === 'projects' ? 'dashboard-span-wide' : 'dashboard-span-narrow',
                ),
              )}
            </section>
          )}

          {railWidgets.length > 0 && (
            <section className="dashboard-band dashboard-band-rail" aria-label="Radar and activity">
              {railWidgets.map((definition) => renderWidget(definition))}
            </section>
          )}
        </div>
      )}

      <DashboardCustomizePanel
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        hiddenWidgetIds={hiddenWidgetIds}
        onToggleWidget={toggleWidget}
        density={density}
        onChangeDensity={setDensity}
        onReset={resetDashboard}
      />
    </div>
  )
}
