import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'framer-motion'
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react'
import { StrideLogo } from '../../../components/StrideLogo'
import { THEME_MODE_KEY } from '../../../lib/storageKeys'
import { navLinks } from '../data'

export function Nav({ onNavigate }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark-theme'),
  )
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const sections = navLinks
      .map((l) => document.getElementById(l.href.replace('#', '')))
      .filter(Boolean)
    if (!sections.length) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`)
        })
      },
      { rootMargin: '-38% 0px -55% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const toggleTheme = () => {
    const nextDark = !isDark
    document.documentElement.classList.toggle('dark-theme', nextDark)
    setIsDark(nextDark)
    try {
      localStorage.setItem(THEME_MODE_KEY, nextDark ? 'dark' : 'light')
    } catch {
      // Ignore storage errors in restricted contexts
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', nextDark ? '#0a0a0a' : '#ffffff')
    }
  }

  const scrollTo = (href) => {
    setOpen(false)
    const id = href.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <header className="bs-nav">
      <nav className="bs-nav__inner" aria-label="Primary">
        <div className="bs-nav__brand-wrap">
          <button type="button" className="bs-nav__brand" onClick={() => onNavigate('/')} aria-label="Stride home">
            <StrideLogo size={26} className="bs-nav__mark" />
            <span>Stride</span>
          </button>
          <span className="bs-nav__edition">PERSONAL OS · EDITION 01</span>
        </div>

        <div className="bs-nav__links" role="list">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              role="listitem"
              aria-current={active === l.href ? 'true' : undefined}
              className={`bs-nav__link${active === l.href ? ' is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                scrollTo(l.href)
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="bs-nav__actions">
          <button
            type="button"
            className="bs-btn bs-btn--icon"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="bs-btn bs-btn--ghost bs-btn--small bs-nav__login"
            onClick={() => onNavigate('/login')}
          >
            Log in
          </button>
          <button
            type="button"
            className="bs-btn bs-btn--primary bs-btn--small"
            onClick={() => onNavigate('/signup')}
          >
            Start free <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="bs-btn bs-btn--icon bs-nav__burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {!reduce && (
        <motion.div
          className="bs-nav__progress"
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="bs-nav__drawer"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={reduce ? {} : { opacity: 1, height: 'auto' }}
            exit={reduce ? {} : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="bs-nav__drawer-link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo(l.href)
                }}
              >
                {l.label}
              </a>
            ))}
            <div className="bs-nav__drawer-actions">
              <button
                type="button"
                className="bs-btn bs-btn--ghost bs-btn--small"
                onClick={() => {
                  setOpen(false)
                  onNavigate('/login')
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className="bs-btn bs-btn--primary bs-btn--small"
                onClick={() => {
                  setOpen(false)
                  onNavigate('/signup')
                }}
              >
                Start free <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
