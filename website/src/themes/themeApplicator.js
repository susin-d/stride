import { THEME_MODE_KEY } from '../lib/storageKeys'

// Appearance engine — Stride ships exactly two modes, white and dark, and a
// strictly monochrome palette (ADR 0057). There is no preset catalog and no
// color customization: the palettes live in styles/themes/index.css and
// styles/themes/dark.css, and this module only toggles them by class and
// applies the user's geometry/motion choices.

export const THEME_MODES = [
  {
    id: 'light',
    mode: 'light',
    name: 'White',
    description: 'Pure white canvas with a neutral ink ramp — the light half of the monochrome system.',
  },
  {
    id: 'dark',
    mode: 'dark',
    name: 'Dark',
    description: 'Neutral obsidian ramp with light ink emphasis — the dark half of the monochrome system.',
  },
  {
    id: 'void',
    mode: 'void',
    name: 'Void',
    description: 'Deep obsidian IDE aesthetic with low-contrast structural dividers and pure neutral ink.',
  },
]

export const MODE_IDS = THEME_MODES.map((mode) => mode.id)

export const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter (Default)', value: "'Inter', sans-serif" },
  { id: 'roboto', name: 'Roboto', value: "'Roboto', sans-serif" },
  { id: 'outfit', name: 'Outfit', value: "'Outfit', sans-serif" },
  { id: 'jakarta', name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
  { id: 'fira', name: 'Fira Code (Monospace)', value: "'Fira Code', monospace" },
  { id: 'system', name: 'System Default UI', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
]

export const RADIUS_OPTIONS = [
  {
    id: 'sharp',
    name: 'Sharp (0px)',
    tokens: {
      '--radius-xs': '0px',
      '--radius-sm': '0px',
      '--radius-md': '0px',
      '--radius-lg': '0px',
      '--radius-xl': '0px',
    },
  },
  {
    id: 'subtle',
    name: 'Subtle (4px)',
    tokens: {
      '--radius-xs': '2px',
      '--radius-sm': '4px',
      '--radius-md': '6px',
      '--radius-lg': '8px',
      '--radius-xl': '10px',
    },
  },
  {
    id: 'modern',
    name: 'Modern Soft (9px)',
    tokens: {
      '--radius-xs': '4px',
      '--radius-sm': '6px',
      '--radius-md': '9px',
      '--radius-lg': '12px',
      '--radius-xl': '16px',
    },
  },
  {
    id: 'rounded',
    name: 'Rounded (16px)',
    tokens: {
      '--radius-xs': '6px',
      '--radius-sm': '10px',
      '--radius-md': '14px',
      '--radius-lg': '18px',
      '--radius-xl': '24px',
    },
  },
  {
    id: 'bubble',
    name: 'Curved Bubble (24px)',
    tokens: {
      '--radius-xs': '8px',
      '--radius-sm': '14px',
      '--radius-md': '20px',
      '--radius-lg': '28px',
      '--radius-xl': '36px',
    },
  },
]

export const DENSITY_OPTIONS = [
  {
    id: 'compact',
    name: 'Compact (Power User)',
    tokens: {
      '--layout-card-padding': '12px',
      '--layout-section-gap': '16px',
      '--layout-gutter': '16px',
    },
  },
  {
    id: 'default',
    name: 'Default Balanced',
    tokens: {
      '--layout-card-padding': 'clamp(16px, 1.8vw, 22px)',
      '--layout-section-gap': 'clamp(18px, 2.2vw, 28px)',
      '--layout-gutter': 'clamp(16px, 3vw, 40px)',
    },
  },
  {
    id: 'spacious',
    name: 'Spacious (Relaxed)',
    tokens: {
      '--layout-card-padding': '28px',
      '--layout-section-gap': '36px',
      '--layout-gutter': '48px',
    },
  },
]

export const ELEVATION_OPTIONS = [
  {
    id: 'flat',
    name: 'Flat Minimalist (No Shadows)',
    tokens: {
      '--shadow-sm': 'none',
      '--shadow-md': 'none',
      '--shadow-lg': 'none',
      '--shadow-surface': 'none',
    },
  },
  {
    id: 'subtle',
    name: 'Subtle Modern Elevation',
    tokens: {
      '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
      '--shadow-md': '0 4px 8px rgba(0, 0, 0, 0.06)',
      '--shadow-lg': '0 12px 30px rgba(0, 0, 0, 0.1)',
      '--shadow-surface': '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
  },
  {
    id: 'deep',
    name: 'Deep 3D Floating Surfaces',
    tokens: {
      '--shadow-sm': '0 2px 6px rgba(0, 0, 0, 0.12)',
      '--shadow-md': '0 8px 24px rgba(0, 0, 0, 0.18)',
      '--shadow-lg': '0 25px 60px rgba(0, 0, 0, 0.28)',
      '--shadow-surface': '0 4px 18px rgba(0, 0, 0, 0.15)',
    },
  },
]

export const MOTION_OPTIONS = [
  {
    id: 'none',
    name: 'Instant (0ms)',
    tokens: {
      '--transition-fast': '0ms',
      '--transition-normal': '0ms',
      '--transition-slow': '0ms',
    },
  },
  {
    id: 'fast',
    name: 'Fast Snap (100ms)',
    tokens: {
      '--transition-fast': '80ms ease',
      '--transition-normal': '120ms ease',
      '--transition-slow': '180ms ease',
    },
  },
  {
    id: 'normal',
    name: 'Smooth Default (200ms)',
    tokens: {
      '--transition-fast': '140ms ease',
      '--transition-normal': '200ms ease',
      '--transition-slow': '300ms ease',
    },
  },
  {
    id: 'relaxed',
    name: 'Relaxed Fluid (350ms)',
    tokens: {
      '--transition-fast': '200ms ease',
      '--transition-normal': '350ms ease',
      '--transition-slow': '500ms ease',
    },
  },
]

// Geometry/motion defaults — one source for the hook, the reset action, and
// resetThemeVariables() so the three can never drift apart.
export const DEFAULT_APPEARANCE = {
  fontFamily: 'inter',
  radius: 'modern',
  density: 'default',
  elevation: 'subtle',
  motion: 'normal',
}

const OPTION_SOURCES = {
  fontFamily: FONT_OPTIONS,
  radius: RADIUS_OPTIONS,
  density: DENSITY_OPTIONS,
  elevation: ELEVATION_OPTIONS,
  motion: MOTION_OPTIONS,
}

const VALID_MODES = ['light', 'dark', 'void']

export function resolveMode(modeId) {
  return VALID_MODES.includes(modeId) ? modeId : 'dark'
}

export function readStoredMode(storage) {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  const stored = store?.getItem(THEME_MODE_KEY)
  // Fresh visitors land on dark (ADR 0028 behaviour kept under ADR 0057).
  return VALID_MODES.includes(stored) ? stored : 'dark'
}

function syncThemeColorMeta(resolvedMode) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (!metaThemeColor) return
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-primary')
    .trim()
  const fallback = resolvedMode === 'light' ? '#ffffff' : (resolvedMode === 'void' ? '#121212' : '#0a0a0a')
  metaThemeColor.setAttribute('content', resolved || fallback)
}

export function applyTheme(data) {
  if (!data || typeof data !== 'object') return
  const root = document.documentElement
  const resolvedMode = resolveMode(data.mode)

  root.classList.remove('dark-theme', 'void-theme')
  if (resolvedMode === 'dark') {
    root.classList.add('dark-theme')
  } else if (resolvedMode === 'void') {
    root.classList.add('void-theme')
  }

  try {
    localStorage.setItem(THEME_MODE_KEY, resolvedMode)
  } catch {
    /* storage unavailable (private mode) — the class toggle above still applies */
  }
  syncThemeColorMeta(resolvedMode)

  Object.entries(OPTION_SOURCES).forEach(([optionKey, options]) => {
    const selected = options.find((option) => option.id === data[optionKey])
    if (!selected) return
    if (optionKey === 'fontFamily') {
      root.style.setProperty('--font-family', selected.value)
      return
    }
    Object.entries(selected.tokens).forEach(([token, value]) => root.style.setProperty(token, value))
  })
}

export function resetThemeVariables() {
  const root = document.documentElement
  root.style.removeProperty('--font-family')
  Object.entries(OPTION_SOURCES).forEach(([optionKey, options]) => {
    if (optionKey === 'fontFamily') return
    const fallback = options.find((option) => option.id === DEFAULT_APPEARANCE[optionKey])
    if (!fallback) return
    Object.keys(fallback.tokens).forEach((token) => root.style.removeProperty(token))
  })
}
