import { ArrowUpRight } from 'lucide-react'

/**
 * Compact scannable list of records inside a dashboard bento card.
 */
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

/**
 * Monochrome editorial bento card shell with header count and quick navigation.
 */
export function WidgetCard({ definition, children, total, onOpen, className = '' }) {
  const Icon = definition.icon
  return (
    <article
      className={`dashboard-widget ${className}`.trim()}
      data-widget={definition.id}
    >
      <header className="dashboard-widget-header">
        <div className="dashboard-widget-title">
          <span className="dashboard-widget-icon">
            <Icon size={15} aria-hidden="true" />
          </span>
          <h2>{definition.title}</h2>
          {total != null && <span className="dashboard-widget-count">{total}</span>}
        </div>
        {onOpen && (
          <button
            className="dashboard-widget-open"
            type="button"
            onClick={onOpen}
            aria-label={`Open ${definition.title}`}
          >
            <span>Open</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        )}
      </header>
      <div className="dashboard-widget-body">{children}</div>
    </article>
  )
}
