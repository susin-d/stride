import { Check, RotateCcw, X } from 'lucide-react'
import { dashboardWidgets } from '../../dashboard/dashboardConfig'

export function DashboardCustomizePanel({
  isOpen,
  onClose,
  editing,
  onToggleEditing,
  hiddenWidgetIds,
  onToggleWidget,
  density,
  onChangeDensity,
  onReset,
}) {
  if (!isOpen) return null

  return (
    <div className="dashboard-panel-backdrop" onMouseDown={onClose} role="presentation">
      <aside className="dashboard-customize-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p>Dashboard</p>
            <h2>Customize</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close customize panel">
            <X size={19} />
          </button>
        </header>
        <section>
          <h3>Layout editing</h3>
          <button
            className={`dashboard-edit-toggle ${editing ? 'active' : ''}`}
            onClick={onToggleEditing}
          >
            <span className="edit-status">
              <span className="status-dot" />
              {editing ? 'Editing enabled' : 'Editing disabled'}
            </span>
            <span className="edit-action">{editing ? 'Done' : 'Edit layout'}</span>
          </button>
          <p className="dashboard-help">Drag cards by their headers and resize from the highlighted edges.</p>
        </section>
        <section>
          <h3>Widget visibility</h3>
          <div className="dashboard-widget-toggles">
            {dashboardWidgets.map(({ id, title, icon: Icon }) => {
              const visible = !hiddenWidgetIds.includes(id)
              return (
                <button key={id} onClick={() => onToggleWidget(id)} className={visible ? 'visible' : ''}>
                  <Icon size={16} />
                  <span>{title}</span>
                  <i>{visible && <Check size={14} />}</i>
                </button>
              )
            })}
          </div>
        </section>
        <section>
          <h3>Density</h3>
          <div className="dashboard-density-options">
            {['compact', 'balanced', 'spacious'].map((option) => (
              <button
                key={option}
                className={density === option ? 'active' : ''}
                onClick={() => onChangeDensity(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
        <button className="dashboard-reset" onClick={onReset}>
          <RotateCcw size={16} /> Reset default layout
        </button>
      </aside>
    </div>
  )
}
