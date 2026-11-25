import '../styles/pages/usage.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FilterPills, LoadingState, PageHeader } from '../components/ui'
import { getUsageSummary, getUsageLogs } from '../lib/usageApi'
import { formatTokens } from './usage/usageFormatters'
import { UsageHeatmap } from './usage/UsageHeatmap'
import { UsageTrendChart } from './usage/UsageTrendChart'
import { UsageDonutChart } from './usage/UsageDonutChart'

export function UsagePage() {
  const [days, setDays] = useState(30)
  const [activityMode, setActivityMode] = useState('Daily')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const s = await getUsageSummary(days)
      getUsageLogs({ limit: 100, days }).catch(() => {})
      setSummary(s)
    } catch (e) {
      setError(e.message || 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const topMetrics = useMemo(() => {
    if (!summary) return null
    const longest = summary.longest_session_tokens || 0
    return {
      total: formatTokens(summary.total_tokens || 0),
      peak: formatTokens(summary.peak_tokens || 0),
      longestLabel: longest ? formatTokens(longest) : '0',
      currentStreak: `${summary.current_streak || 0} d`,
      longestStreak: `${summary.longest_streak || 0} d`,
    }
  }, [summary])

  if (loading) return <div className="usage-page-dark"><LoadingState message="Loading usage…" /></div>

  return (
    <div className="usage-page-dark">
      <PageHeader
        actions={
          <>
            <FilterPills
              ariaLabel="Time range"
              items={[
                { id: 7, label: 'Last 7 days' },
                { id: 30, label: 'Last 30 days' },
              ]}
              activeId={days}
              onChange={setDays}
            />
            <button type="button" className="secondary-button" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </button>
          </>
        }
      />

      <div className="usage-top-card">
        <div className="usage-top-item">
          <div className="usage-top-value">{topMetrics?.total || '—'}</div>
          <div className="usage-top-label">Total tokens</div>
        </div>
        <div className="usage-top-item">
          <div className="usage-top-value">{topMetrics?.peak || '—'}</div>
          <div className="usage-top-label">Peak tokens</div>
        </div>
        <div className="usage-top-item">
          <div className="usage-top-value">{topMetrics?.longestLabel || '0'}</div>
          <div className="usage-top-label">Longest session</div>
        </div>
        <div className="usage-top-item">
          <div className="usage-top-value">{topMetrics?.currentStreak || '0 d'}</div>
          <div className="usage-top-label">Current streak</div>
        </div>
        <div className="usage-top-item">
          <div className="usage-top-value">{topMetrics?.longestStreak || '0 d'}</div>
          <div className="usage-top-label">Longest streak</div>
        </div>
      </div>

      <UsageHeatmap
        summary={summary}
        activityMode={activityMode}
        onActivityModeChange={setActivityMode}
        loading={loading}
        error={error}
      />

      <UsageTrendChart summary={summary} days={days} />

      <UsageDonutChart summary={summary} />
    </div>
  )
}
