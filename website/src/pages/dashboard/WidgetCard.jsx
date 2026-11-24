import { ArrowUpRight, GripHorizontal } from 'lucide-react'

export function RecordList({ items, empty = 'Nothing to show.', onNavigate, onOpenNotifications }) {
  if (!items.length) return <p className="dashboard-widget-empty">{empty}</p>
  return (
    <div className="dashboard-record-list">
      {items.map((entry) => {
        const title = <strong>{entry.title}</strong>
        const openDestination = () => {
          if (entry.notification) {
            onOpenNotifications?.()
            return
          }
          if (entry.destination) onNavigate?.(entry.destination, entry.destinationId)
        }

        return (
          <div className="dashboard-record" key={entry.id}>
            <div>
              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-record-title-link"
                >
                  {title}
                </a>
              ) : entry.destination || entry.notification ? (
                <button
                  className="dashboard-record-title-link"
                  type="button"
                  onClick={openDestination}
                >
                  {title}
                </button>
              ) : (
                title
              )}
              {entry.meta && <span>{entry.meta}</span>}
            </div>
            {entry.badge && <em>{entry.badge}</em>}
          </div>
        )
      })}
    </div>
  )
}

export function WidgetCard({ definition, editing, children, total, onOpen }) {
  const Icon = definition.icon
  return (
    <article
      className={`dashboard-widget ${editing ? 'is-editing' : ''}`}
      data-widget={definition.id}
      data-module={definition.module || 'work'}
    >
      <header className="dashboard-widget-header dashboard-widget-drag-handle">
        <span className="dashboard-widget-icon"><Icon size={17} /></span>
        <div>
          <p>{definition.title}</p>
          {total != null && <strong>{total}</strong>}
        </div>
        {editing && <GripHorizontal className="dashboard-drag-indicator" size={20} />}
      </header>
      <div className="dashboard-widget-body">{children}</div>
      <button className="dashboard-widget-action" type="button" onClick={onOpen}>
        View details <ArrowUpRight size={15} />
      </button>
    </article>
  )
}
