import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/ui'
import { clampTooltipX, formatFull, formatTokens, getModelColor } from './usageFormatters'

export function UsageDonutChart({ summary }) {
  const [donutTip, setDonutTip] = useState(null)
  const [activeDonut, setActiveDonut] = useState(null)

  const donut = useMemo(() => {
    const total = summary?.total_tokens || 0
    const models = summary?.by_model || []
    if (models.length === 0 || total === 0) return { total, segments: [] }
    const segments = models.slice(0, 5).map((m, i) => ({
      name: m.model,
      tokens: m.tokens,
      color: getModelColor(m.model, i),
      pct: total ? Math.round((m.tokens / total) * 100) : 0,
    }))
    return { total, segments }
  }, [summary])

  const donutCirc = 2 * Math.PI * 60
  let donutOffset = 0

  return (
    <div className="usage-dark-card">
      <div className="usage-card-title usage-card-title--mb-lg">Model usage</div>
      {donut.segments.length ? (
        <div className="usage-donut-wrap">
          <div
            className="usage-donut-stage"
            onMouseLeave={() => { setDonutTip(null); setActiveDonut(null) }}
          >
            <svg width="180" height="180" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--border-color)" strokeWidth="20" />
              {donut.segments.map((seg) => {
                const len = (seg.pct / 100) * donutCirc
                const isActive = activeDonut === seg.name
                const isDimmed = activeDonut && !isActive
                const el = (
                  <circle
                    key={seg.name}
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeDasharray={`${len} ${donutCirc - len}`}
                    strokeDashoffset={-donutOffset}
                    strokeLinecap="butt"
                    transform="rotate(-90 80 80)"
                    className={`usage-donut-segment ${isDimmed ? 'dimmed' : ''}`}
                    onMouseEnter={(e) => {
                      setActiveDonut(seg.name)
                      setDonutTip({ name: seg.name, tokens: seg.tokens, pct: seg.pct, color: seg.color, x: e.clientX, y: e.clientY })
                    }}
                    onMouseMove={(e) => setDonutTip({ name: seg.name, tokens: seg.tokens, pct: seg.pct, color: seg.color, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => { setDonutTip(null); setActiveDonut(null) }}
                  />
                )
                donutOffset += len
                return el
              })}
            </svg>
            <div className="usage-donut-center">
              <div className="usage-donut-total">{formatTokens(donut.total)}</div>
              <div className="usage-donut-sub">tokens</div>
            </div>
            {donutTip ? (
              <div className="usage-tooltip" style={{ left: clampTooltipX(donutTip.x), top: donutTip.y - 56 }}>
                <div className="usage-tooltip-title">
                  <span className="usage-tooltip-dot" style={{ background: donutTip.color }} />
                  {donutTip.name}
                </div>
                <div className="usage-tooltip-line">
                  {formatFull(donutTip.tokens)} tokens <span className="usage-tooltip-value">{donutTip.pct}%</span>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            {donut.segments.map((seg) => (
              <div key={seg.name} className="usage-model-row">
                <div className="usage-model-left">
                  <span className="usage-model-dot" style={{ background: seg.color }} />
                  <div>
                    <div className="usage-model-name">{seg.name}</div>
                    <div className="usage-model-tokens">{formatTokens(seg.tokens)} tokens</div>
                  </div>
                </div>
                <div className="usage-model-pct">{seg.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No model data" description="Model breakdown appears after your first AI request." />
      )}
    </div>
  )
}
