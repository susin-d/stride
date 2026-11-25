import { ArrowRight, LogIn } from 'lucide-react'
import { StrideLogo } from '../../../components/StrideLogo'

export function Finale({ onNavigate }) {
  return (
    <section className="bs-finale" aria-labelledby="finale-title">
      <div className="broadsheet__container bs-finale__inner">
        <div>
          <h2 id="finale-title" className="bs-finale__title">
            Build a workspace that moves with your ambition.
          </h2>
          <p className="bs-finale__sub">
            Free to start. Your tasks, code, calendar, and Eve memory stay isolated to your account.
          </p>
        </div>

        <div className="bs-finale__actions">
          <button
            type="button"
            className="bs-btn bs-btn--primary"
            onClick={() => onNavigate('/signup')}
          >
            Create your account <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="bs-btn bs-btn--ghost"
            onClick={() => onNavigate('/login')}
          >
            <LogIn size={15} aria-hidden="true" /> Log in
          </button>
        </div>
      </div>
    </section>
  )
}

const footerSections = [
  {
    title: 'Sections',
    links: [
      { label: 'Product Folio', id: 'folio' },
      { label: 'Eve AI Dossier', id: 'eve' },
      { label: 'System Index', id: 'index' },
      { label: 'FAQ', id: 'faq' },
    ],
  },
  {
    title: 'Account',
    routes: [
      { label: 'Create account', path: '/signup' },
      { label: 'Log in', path: '/login' },
    ],
  },
  {
    title: 'Legal',
    routes: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
    ],
  },
]

export function Footer({ onNavigate }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bs-footer" aria-label="Footer">
      <div className="broadsheet__container">
        <div className="bs-footer__grid">
          <div>
            <div className="bs-footer__brand">
              <StrideLogo size={24} className="bs-nav__mark" />
              <span>Stride</span>
            </div>
            <p className="bs-footer__desc">
              One monochrome operating system for tasks, code, contests, calendar, and Eve AI.
            </p>
          </div>

          {footerSections.map((col) => (
            <div key={col.title}>
              <p className="bs-footer__col-title">{col.title}</p>
              <div className="bs-footer__list">
                {col.links?.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className="bs-footer__link"
                    onClick={() => scrollTo(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
                {col.routes?.map((r) => (
                  <button
                    key={r.path}
                    type="button"
                    className="bs-footer__link"
                    onClick={() => onNavigate(r.path)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bs-footer__bottom">
          <span>© {new Date().getFullYear()} Stride</span>
          <span>WHITE &amp; DARK MONOCHROME · EDITION 01</span>
        </div>
      </div>
    </footer>
  )
}
