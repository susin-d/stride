const MODEL_COLORS = {
  'GLM-5.3': 'var(--chart-1)',
  'GLM-5-Turbo': 'var(--chart-2)',
  'glm-5.3': 'var(--chart-1)',
  'glm-5-turbo': 'var(--chart-2)',
}

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
]

export function getModelColor(name, idx) {
  return MODEL_COLORS[name] || PALETTE[idx % PALETTE.length]
}

export function formatTokens(n) {
  const v = Number(n || 0)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1000).toFixed(1)}k`
  return String(v)
}

export function formatFull(n) {
  return Number(n || 0).toLocaleString()
}

export function getHeatLevel(tokens) {
  if (tokens === 0) return 0
  if (tokens < 100000) return 1
  if (tokens < 800000) return 2
  if (tokens < 2000000) return 3
  return 4
}

export function clampTooltipX(x) {
  if (typeof window === 'undefined') return x + 12
  return Math.min(window.innerWidth - 180, Math.max(8, x + 12))
}

export function getTrendTooltipTop(y) {
  return Math.max(8, y - 170)
}
