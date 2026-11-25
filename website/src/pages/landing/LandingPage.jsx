import { MotionConfig, useReducedMotion } from 'framer-motion'
import { Nav } from './sections/Nav'
import { Hero } from './sections/Hero'
import { ProductFolio } from './sections/ProductFolio'
import { Eve } from './sections/Eve'
import { SystemIndex } from './sections/SystemIndex'
import { FAQ } from './sections/FAQ'
import { Finale, Footer } from './sections/Finale'
import './broadsheet-base.css'
import './broadsheet-hero.css'
import './broadsheet-sections.css'

export function LandingPage({ user, onNavigate }) {
  const reduce = useReducedMotion()

  // user prop is accepted for contract; all CTAs still go to /signup or /login per spec
  void user

  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'user'}>
      <main id="main-content" className="broadsheet" tabIndex={-1}>
        <Nav onNavigate={onNavigate} />
        <Hero onNavigate={onNavigate} />
        <ProductFolio onNavigate={onNavigate} />
        <Eve onNavigate={onNavigate} />
        <SystemIndex />
        <FAQ onNavigate={onNavigate} />
        <Finale onNavigate={onNavigate} />
        <Footer onNavigate={onNavigate} />
      </main>
    </MotionConfig>
  )
}
