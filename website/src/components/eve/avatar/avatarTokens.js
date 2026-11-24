// Avatar tone helpers. The avatar accent is always the theme's neutral ink
// token, so no per-theme hue mapping exists (ADR 0057).

export function shouldReduceMotion(prefMotion) {
  if (prefMotion === 'reduced') return true
  if (prefMotion === 'on') return false
  // auto → respect OS
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}
