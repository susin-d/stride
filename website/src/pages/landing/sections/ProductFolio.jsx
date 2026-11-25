import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { folioScenes } from '../data'

export function ProductFolio({ onNavigate }) {
  const reduce = useReducedMotion()
  const [activeId, setActiveId] = useState(folioScenes[0].id)
  const activeScene = folioScenes.find((s) => s.id === activeId) || folioScenes[0]
  const { vignette } = activeScene

  return (
    <section id="folio" className="broadsheet__section" aria-labelledby="folio-title">
      <div className="broadsheet__container">
        <div className="bs-section-header">
          <div>
            <h2 id="folio-title" className="bs-h2">
              One calm surface for everything you build.
            </h2>
            <p className="bs-lead">
              Switch between core surfaces — each wired to the same workspace state, calendar feed, and AI memory.
            </p>
          </div>
          <span className="bs-section-meta">02 / PRODUCT FOLIO</span>
        </div>

        <div className="bs-folio__layout">
          <div className="bs-folio__rail" role="tablist" aria-label="Product surfaces">
            {folioScenes.map((scene) => {
              const isSelected = scene.id === activeId
              return (
                <button
                  key={scene.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`folio-panel-${scene.id}`}
                  id={`folio-tab-${scene.id}`}
                  className={`bs-folio__tab${isSelected ? ' is-active' : ''}`}
                  onClick={() => setActiveId(scene.id)}
                >
                  {isSelected && !reduce && (
                    <motion.span
                      layoutId="folio-active-bar"
                      className="bs-folio__tab-bar"
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      aria-hidden="true"
                    />
                  )}
                  {isSelected && reduce && <span className="bs-folio__tab-bar" aria-hidden="true" />}
                  <div className="bs-folio__tab-head">
                    <span>
                      {scene.numeral} — {scene.pillar}
                    </span>
                    <scene.icon size={14} aria-hidden="true" />
                  </div>
                  <span className="bs-folio__tab-title">{scene.label}</span>
                  <p className="bs-folio__tab-copy">{scene.headline}</p>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene.id}
              role="tabpanel"
              id={`folio-panel-${activeScene.id}`}
              aria-labelledby={`folio-tab-${activeScene.id}`}
              className="bs-folio__stage"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              exit={reduce ? {} : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="bs-folio__stage-head">
                <div>
                  <h3 className="bs-folio__stage-title">{activeScene.headline}</h3>
                  <p className="bs-folio__stage-desc">{activeScene.copy}</p>
                </div>
                <button
                  type="button"
                  className="bs-btn bs-btn--ghost bs-btn--small"
                  onClick={() => onNavigate('/signup')}
                >
                  Open {activeScene.label} <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              <div className="bs-folio__vignette">
                <div className="bs-folio__vignette-bar">
                  <span>{vignette.barLeft}</span>
                  <span>{vignette.barRight}</span>
                </div>

                {vignette.code ? (
                  <pre className="bs-folio__code">
                    <code>{vignette.code}</code>
                  </pre>
                ) : (
                  <div className="bs-folio__vignette-grid">
                    {vignette.cells.map((cell) => (
                      <div key={cell.label} className="bs-folio__cell">
                        <span className="bs-folio__cell-label">{cell.label}</span>
                        <span className="bs-folio__cell-val">{cell.value}</span>
                        <span className="bs-folio__cell-label">{cell.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ul className="bs-folio__bullets">
                {activeScene.bullets.map((b) => (
                  <li key={b}>
                    <Check size={12} aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
