import { Check, RotateCcw, X } from 'lucide-react'
import { DASHBOARD_SECTIONS, dashboardWidgets } from '../../dashboard/dashboardConfig'

/**
 * Slide-over customize panel for toggling dashboard widgets and spacing density.
 */
export function DashboardCustomizePanel({
  isOpen,
  onClose,
  hiddenWidgetIds,
  onToggleWidget,
  density,
  onChangeDensity,
  onReset,
}) {
  if (!isOpen) return null

  return (
    <div className="dashboard-panel-backdrop" onMouseDown={onClose} role="presentation">
      <aside
        className="dashboard-customize-panel"
        aria-label="Customize dashboard"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2>Customize</h2>
            <p className="dashboard-customize-subtitle">Show or hide cards and tune spacing.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close customize panel">
            <X size={19} />
          </button>
        </header>

        {DASHBOARD_SECTIONS.map((section) => {
          const sectionWidgets = dashboardWidgets.filter((w) => w.section === section.id)
          return (
            <section key={section.id}>
              <h3>{section.label}</h3>
              <div className="dashboard-widget-toggles">
                {sectionWidgets.map(({ id, title, icon: Icon }) => {
                  const visible = !hiddenWidgetIds.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onToggleWidget(id)}
                      className={visible ? 'visible' : ''}
                      aria-pressed={visible}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{title}</span>
                      <i>{visible && <Check size={14} aria-hidden="true" />}</i>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}

        <section>
          <h3>Density</h3>
          <div className="dashboard-density-options">
            {['compact', 'balanced', 'spacious'].map((option) => (
              <button
                key={option}
                type="button"
                className={density === option ? 'active' : ''}
                onClick={() => onChangeDensity(option)}
                aria-pressed={density === option}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="dashboard-reset" onClick={onReset}>
          <RotateCcw size={16} aria-hidden="true" /> Reset defaults
        </button>
      </aside>
    </div>
  )
}
