import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Plus } from 'lucide-react'
import { faqs } from '../data'

export function FAQ({ onNavigate }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="broadsheet__section" aria-labelledby="faq-title">
      <div className="broadsheet__container">
        <div className="bs-section-header">
          <div>
            <h2 id="faq-title" className="bs-h2">
              The fine print.
            </h2>
            <p className="bs-lead">
              Straight answers on integrations, privacy, and how Eve operates.
            </p>
          </div>
          <span className="bs-section-meta">05 / QUESTIONS</span>
        </div>

        <div className="bs-faq__layout">
          <div className="bs-faq__side">
            <p className="bs-lead">
              No dark patterns or lock-in. Connect only the services you use and revoke access anytime in Settings.
            </p>
            <button
              type="button"
              className="bs-btn bs-btn--ghost bs-btn--small"
              onClick={() => onNavigate('/signup')}
            >
              Create account <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="bs-faq__list">
            {faqs.map((f, i) => {
              const isOpen = open === i
              return (
                <div key={f.q} className={`bs-faq__item${isOpen ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="bs-faq__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{f.q}</span>
                    <Plus size={16} className="bs-faq__icon" aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-a-${i}`}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={reduce ? {} : { height: 'auto', opacity: 1 }}
                        exit={reduce ? {} : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="bs-faq__answer-wrap"
                      >
                        <div className="bs-faq__answer">{f.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
