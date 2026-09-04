import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics } from '../../services/api'
import { TrendLineChart } from '../../components/admin/TrendLineChart'
import { CategoryBarChart } from '../../components/admin/CategoryBarChart'
import { DateRangeFilter, type DateRangeOption } from '../../components/admin/DateRangeFilter'
import { filterTrend } from '../../utils/trend'
import type { AnalyticsSummary } from '../../types'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [range, setRange] = useState<DateRangeOption>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    getAnalytics().then(setAnalytics)
  }, [])

  const resolutionTrend = useMemo(
    () => (analytics ? filterTrend(analytics.resolutionTrend, range, customStart, customEnd) : []),
    [analytics, range, customStart, customEnd]
  )
  const escalationTrend = useMemo(
    () => (analytics ? filterTrend(analytics.escalationTrend, range, customStart, customEnd) : []),
    [analytics, range, customStart, customEnd]
  )

  if (!analytics) {
    return <p className="p-8 text-text-secondary">Loading…</p>
  }

  const stats: Array<[string, string]> = [
    ['Resolution Rate', `${Math.round(analytics.resolutionRate * 100)}%`],
    ['Escalation Rate', `${Math.round(analytics.escalationRate * 100)}%`],
    ['Average Resolution Time', analytics.avgResolutionTime],
    ['First Contact Resolution', `${Math.round(analytics.firstContactResolution * 100)}%`],
    ['Repeat Contact Rate', `${Math.round(analytics.repeatContactRate * 100)}%`],
    ['CSAT', analytics.csat.toFixed(1)],
  ]

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Analytics</h1>
        <Link to="/admin" className="text-sm font-medium text-primary">
          Back to Dashboard
        </Link>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="mt-1 text-2xl font-bold text-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <DateRangeFilter
          value={range}
          onChange={setRange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TrendLineChart title="Resolution trend" data={resolutionTrend} color="#16A34A" />
        <TrendLineChart title="Escalation trend" data={escalationTrend} color="#D97706" />
        <CategoryBarChart title="Common router problems" data={analytics.commonIssues} />
        <CategoryBarChart title="Most common LED patterns" data={analytics.commonLedPatterns} />
        <CategoryBarChart title="Most successful troubleshooting steps" data={analytics.topTroubleshootingSteps} />
      </div>
    </div>
  )
}
