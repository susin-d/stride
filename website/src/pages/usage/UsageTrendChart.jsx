import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/ui'
import { clampTooltipX, formatFull, getModelColor, getTrendTooltipTop } from './usageFormatters'

export function UsageTrendChart({ summary, days }) {
  const [trendTip, setTrendTip] = useState(null)

  const trend = useMemo(() => {
    if (!summary) return { labels: [], series: [] }
    const byModelDaily = summary.daily_by_model || []
    const models = summary.model_list?.length
      ? summary.model_list.slice(0, 4)
      : (summary.by_model || []).slice(0, 4).map((m) => m.model)
    if (models.length === 0) return { labels: [], series: [] }
    const modelSeries = models.map((m, idx) => ({ name: m, color: getModelColor(m, idx), points: [] }))
    const mapByDate = {}
    for (const entry of byModelDaily) mapByDate[entry.date] = entry.by_model
    const labels = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      labels.push({ key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
      for (const s of modelSeries) s.points.push(mapByDate[key]?.[s.name] || 0)
    }
    return { labels, series: modelSeries }
  }, [summary, days])

  const maxTrend = useMemo(() => Math.max(1, ...trend.series.flatMap((s) => s.points)), [trend])
  const hasTrendData = trend.series.length > 0 && trend.series.some((s) => s.points.some((v) => v > 0))

  return (
    <div className="usage-trend-wrap">
      <div className="usage-card-title usage-card-title--mb">Daily token trend chart</div>
      {hasTrendData ? (
        <>
          <div className="usage-legend">
            {trend.series.map((s) => (
              <span key={s.name} className="usage-legend-item">
                <span className="usage-legend-dot" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
          <div
            className="usage-trend-stage"
            onMouseLeave={() => setTrendTip(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const idx = Math.round((x / rect.width) * (trend.labels.length - 1))
              const clamped = Math.max(0, Math.min(trend.labels.length - 1, idx))
              const label = trend.labels[clamped]
              if (!label) return
              const values = trend.series.map((s) => ({ name: s.name, color: s.color, value: s.points[clamped] || 0 }))
              setTrendTip({ x: e.clientX, y: e.clientY, date: label.label, key: label.key, values })
            }}
          >
            <svg className="usage-trend-svg" viewBox="0 0 700 160" preserveAspectRatio="none">
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" x2="700" y1={20 + i * 35} y2={20 + i * 35} className="usage-grid-line" />
              ))}
              {trend.series.map((s) => {
                const pts = s.points
                const smooth = pts.map((v, i) => {
                  const x = (i / Math.max(1, pts.length - 1)) * 700
                  const y = 130 - (v / maxTrend) * 100
                  if (i === 0) return `M ${x} ${y}`
                  const prevX = ((i - 1) / Math.max(1, pts.length - 1)) * 700
                  const prevY = 130 - (pts[i - 1] / maxTrend) * 100
                  const cx = (prevX + x) / 2
                  return `C ${cx} ${prevY}, ${cx} ${y}, ${x} ${y}`
                }).join(' ')
                return (
                  <path
                    key={s.name}
                    d={smooth}
                    fill="none"
                    style={{ stroke: s.color }}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )
              })}
              {trendTip ? (
                <line
                  x1={(trend.labels.findIndex((l) => l.key === trendTip.key) / Math.max(1, trend.labels.length - 1)) * 700}
                  x2={(trend.labels.findIndex((l) => l.key === trendTip.key) / Math.max(1, trend.labels.length - 1)) * 700}
                  y1="10"
                  y2="140"
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.7"
                />
              ) : null}
            </svg>
            {trendTip ? (
              <div
                className="usage-tooltip"
                style={{ left: clampTooltipX(trendTip.x), top: getTrendTooltipTop(trendTip.y) }}
              >
                <div className="usage-tooltip-date usage-tooltip-date--spaced">{trendTip.date}</div>
                {trendTip.values.map((v) => (
                  <div key={v.name} className="usage-tooltip-title usage-tooltip-series">
                    <span className="usage-tooltip-dot" style={{ background: v.color }} />
                    {v.name}: <span className="usage-tooltip-value">{formatFull(v.value)} tokens</span>
                  </div>
                ))}
                <div className="usage-tooltip-total">
                  {formatFull(trendTip.values.reduce((a, b) => a + b.value, 0))} total
                </div>
              </div>
            ) : null}
          </div>
          <div className="usage-trend-axis-row">
            {trend.labels.filter((_, i) => i % Math.ceil(trend.labels.length / 6) === 0).map((l) => (
              <span key={l.key} className="usage-trend-axis">{l.label}</span>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No trend data" description="Daily token totals will appear here once you have usage in the selected time range." />
      )}
    </div>
  )
}
