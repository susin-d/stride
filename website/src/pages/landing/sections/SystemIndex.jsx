import { features, workflow } from '../data'

export function SystemIndex() {
  return (
    <section id="index" className="broadsheet__section" aria-labelledby="index-title">
      <div className="broadsheet__container">
        <div className="bs-section-header">
          <div>
            <h2 id="index-title" className="bs-h2">
              Eight modules, one shared state.
            </h2>
            <p className="bs-lead">
              Every surface reads from the same user-scoped database — no scattered tabs, no manual sync.
            </p>
          </div>
          <span className="bs-section-meta">04 / SYSTEM INDEX</span>
        </div>

        <div className="bs-index__grid">
          {features.map((f) => (
            <article key={f.title} className="bs-index__cell">
              <div className="bs-index__cell-head">
                <f.icon size={16} aria-hidden="true" />
                <span className="bs-index__cell-num">{f.num}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>

        <div className="bs-workflow" aria-label="Onboarding workflow">
          {workflow.map((w) => (
            <div key={w.step} className="bs-workflow__step">
              <span className="bs-workflow__num">STEP {w.step}</span>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
