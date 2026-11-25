/**
 * PageHeader — canonical top header / action bar for Stride pages.
 * Since the topbar displays the active route label, top-level pages use PageHeader
 * for contextual description/meta/actions without repeating the page title,
 * while detail/contextual pages pass `title` (and optional `backAction`).
 */
export function PageHeader({
  backAction,
  title,
  description,
  meta,
  actions,
  className = '',
}) {
  return (
    <header className={`page-header ${title ? 'has-title' : 'is-toolbar'} ${className}`.trim()}>
      {(backAction || title || description || meta) && (
        <div className="page-header-main">
          {backAction && <div className="page-header-back">{backAction}</div>}
          {(title || description || meta) && (
            <div className="page-header-copy">
              {title && <h1>{title}</h1>}
              {description && <p className="page-header-description">{description}</p>}
              {meta && <div className="page-header-meta">{meta}</div>}
            </div>
          )}
        </div>
      )}
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  )
}
