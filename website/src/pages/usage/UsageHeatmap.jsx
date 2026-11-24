import { useMemo, useState } from 'react'
import { formatFull, getHeatLevel, clampTooltipX } from './usageFormatters'

export function UsageHeatmap({ summary, activityMode, onActivityModeChange, loading, error }) {
  const [heatmapTip, setHeatmapTip] = useState(null)

  const heatmap = useMemo(() => {
    const dailyMap = {}
    for (const d of summary?.daily || []) dailyMap[d.date] = d.tokens
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - 181)
    const base = []
    for (let i = 0; i < 182; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const k = d.toISOString().slice(0, 10)
      base.push({ key: `${k}-${i}`, tokens: dailyMap[k] || 0, date: k, idx: i })
    }

    if (activityMode === 'Weekly') {
      const weekSums = Array.from({ length: 26 }, () => 0)
      for (const cell of base) weekSums[Math.floor(cell.idx / 7)] += cell.tokens
      return base.map((c) => ({ ...c, level: getHeatLevel(weekSums[Math.floor(c.idx / 7)]) }))
    }
    if (activityMode === 'Cumulative') {
      let cum = 0
      return base.map((c) => {
        cum += c.tokens
        return { ...c, level: getHeatLevel(cum) }
      })
    }
    return base.map((c) => ({ ...c, level: getHeatLevel(c.tokens) }))
  }, [summary, activityMode])

  const heatmapMonths = useMemo(() => {
    if (!heatmap.length) return []
    const seen = new Set()
    const labels = []
    for (const cell of heatmap) {
      const d = new Date(cell.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!seen.has(key)) {
        seen.add(key)
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }))
      }
    }
    return labels
  }, [heatmap])

  const hasHeatmapData = heatmap.some((c) => c.tokens > 0)

  return (
    <div className="usage-dark-card">
      <div className="usage-card-head">
        <div className="usage-card-title">Token activity</div>
        <div className="usage-tabs">
          {['Daily', 'Weekly', 'Cumulative'].map((t) => (
            <button
              key={t}
              type="button"
              className={`usage-tab ${activityMode === t ? 'active' : ''}`}
              onClick={() => onActivityModeChange(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="usage-heatmap-grid">
        {heatmap.map((c) => (
          <div
            key={c.key}
            className={`usage-heatmap-cell ${c.level ? `l${c.level}` : ''}`}
            onMouseEnter={(e) => setHeatmapTip({ date: c.date, tokens: c.tokens, x: e.clientX, y: e.clientY, level: c.level })}
            onMouseMove={(e) => setHeatmapTip({ date: c.date, tokens: c.tokens, x: e.clientX, y: e.clientY, level: c.level })}
            onMouseLeave={() => setHeatmapTip(null)}
          />
        ))}
      </div>

      {heatmapTip ? (
        <div className="usage-tooltip" style={{ left: clampTooltipX(heatmapTip.x), top: heatmapTip.y - 56 }}>
          <div className="usage-tooltip-date">{heatmapTip.date}</div>
          <div className="usage-tooltip-line">
            {formatFull(heatmapTip.tokens)} tokens {heatmapTip.level ? `· level ${heatmapTip.level}` : '· no activity'}
          </div>
        </div>
      ) : null}

      <div
        className="usage-heatmap-months"
        style={heatmapMonths.length ? { gridTemplateColumns: `repeat(${heatmapMonths.length}, 1fr)` } : undefined}
      >
        {heatmapMonths.map((m, i) => <span key={`${m}-${i}`}>{m}</span>)}
      </div>

      {!hasHeatmapData && !loading ? (
        <div className="usage-empty-hint">No activity in this period — chat with Eve to generate usage.</div>
      ) : null}
      {error ? <div className="usage-error-hint">{error}</div> : null}
    </div>
  )
}
