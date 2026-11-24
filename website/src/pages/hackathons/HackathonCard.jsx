import { CalendarDays, ExternalLink, MapPin, Pencil, Trash2, Users } from 'lucide-react'

export function HackathonCard({ hackathon, onOpenHackathon, onEdit, onDelete }) {
  const startsAt = new Date(hackathon.startsAt)
  const endsAt = new Date(hackathon.endsAt)
  const isManual = hackathon.source === 'manual'

  return (
    <article
      className="contest-site-card hackathon-list-card"
      data-record-id={hackathon.id}
    >
      <div className="contest-site-header">
        <div className="hackathon-card-topline">
          <span className="hackathon-card-source">
            {hackathon.source === 'manual' ? 'Stride' : hackathon.source.toUpperCase()}
          </span>
        </div>
        <span className="contest-site-copy">
          {hackathon.url ? (
            <a
              className="hackathon-title-link"
              href={hackathon.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              title="Open hackathon details page in a new tab"
            >
              <strong>{hackathon.title}</strong>
              <ExternalLink size={13} className="hackathon-link-icon" />
            </a>
          ) : (
            <strong
              className="hackathon-title-clickable"
              onClick={(event) => {
                event.stopPropagation()
                onOpenHackathon?.(hackathon.id)
              }}
              title="View hackathon details"
            >
              {hackathon.title}
            </strong>
          )}
          <small>{hackathon.organizer}</small>
        </span>
        <div className="hackathon-card-meta">
          <span>
            <CalendarDays size={13} />
            {startsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
            {endsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="contest-site-content hackathon-detail-content">
        <div className="hackathon-detail-grid">
          <div className="hackathon-detail-item">
            <CalendarDays size={17} />
            <div>
              <span>Dates</span>
              <strong>
                {startsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' – '}
                {endsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>
          </div>
          <div className="hackathon-detail-item">
            <MapPin size={17} />
            <div>
              <span>Format</span>
              <strong>{hackathon.mode}</strong>
            </div>
          </div>
          <div className="hackathon-detail-item">
            <Users size={17} />
            <div>
              <span>Team size</span>
              <strong>{hackathon.teamSize || 'Not specified'}</strong>
            </div>
          </div>
        </div>

        <div className="hackathon-list-footer">
          <div className="hackathon-tags">
            {hackathon.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="hackathon-card-actions">
            <button
              className="secondary-button hackathon-card-action"
              type="button"
              onClick={() => onOpenHackathon?.(hackathon.id)}
            >
              All details
            </button>
            {isManual && (
              <>
                <button
                  className="secondary-button hackathon-card-action"
                  type="button"
                  onClick={() => onEdit(hackathon)}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="secondary-button hackathon-card-action"
                  type="button"
                  onClick={() => onDelete(hackathon.id)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
            {hackathon.url && (
              <a
                className="primary-button hackathon-card-action"
                href={hackathon.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View details <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
