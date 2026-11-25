import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { heroProof, heroWorkbench } from '../data'

export function Hero({ onNavigate }) {
  const reduce = useReducedMotion()

  const scrollToFolio = () => {
    document.getElementById('folio')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section className="bs-hero" aria-labelledby="hero-title">
      <div className="broadsheet__container">
        <div className="bs-hero__strip">
          <span>01 / OVERVIEW — DEVELOPER PERSONAL OS</span>
          <span>MONOCHROME · WHITE &amp; DARK MODES</span>
        </div>

        <div className="bs-hero__grid">
          <div>
            <motion.h1
              id="hero-title"
              className="bs-hero__title"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              Your work and growth, finally in sync.
            </motion.h1>

            <p className="bs-hero__lead">
              Tasks, calendars, competitive coding, jobs, hackathons, a real Monaco workspace,
              and Eve AI — unified into one calm monochrome operating system.
            </p>

            <div className="bs-hero__actions">
              <button
                type="button"
                className="bs-btn bs-btn--primary"
                onClick={() => onNavigate('/signup')}
              >
                Start free <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="bs-btn bs-btn--ghost"
                onClick={scrollToFolio}
              >
                Inspect folio <ArrowDown size={15} aria-hidden="true" />
              </button>
            </div>

            <ul className="bs-hero__proof">
              {heroProof.map((item) => (
                <li key={item.index} className="bs-hero__proof-item">
                  <span className="bs-hero__proof-idx">{item.index}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.aside
            className="bs-workbench"
            aria-label="Live Stride workbench summary"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bs-workbench__head">
              <span className="bs-workbench__status">
                <span className="bs-workbench__dot" aria-hidden="true" />
                {heroWorkbench.workspace}
              </span>
              <span>{heroWorkbench.status}</span>
            </div>

            <div className="bs-workbench__body">
              <div className="bs-workbench__block">
                <div className="bs-workbench__label">
                  <span>Unified Queue</span>
                  <span>Today</span>
                </div>
                <div className="bs-workbench__rows">
                  {heroWorkbench.tasks.map((task) => (
                    <div key={task.title} className="bs-workbench__row">
                      <span>{task.title}</span>
                      <span className="bs-workbench__row-meta">{task.meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bs-workbench__eve">
                <div className="bs-workbench__label">
                  <span>Eve Tool Loop</span>
                  <span>Ready</span>
                </div>
                <code className="bs-workbench__eve-cmd">{heroWorkbench.eveCmd}</code>
                <span className="bs-workbench__eve-note">{heroWorkbench.eveNote}</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}
