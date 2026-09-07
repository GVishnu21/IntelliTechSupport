import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalyticsSummary, getRepeatContactRate, getTickets } from '../../services/api'
import { TrendLineChart } from '../../components/admin/TrendLineChart'
import { CategoryBarChart } from '../../components/admin/CategoryBarChart'
import { DateRangeFilter, type DateRangeOption } from '../../components/admin/DateRangeFilter'
import { filterTrend } from '../../utils/trend'
import { deriveCommonIssues, deriveCommonLedPatterns } from '../../utils/ticketStats'
import { LoadingState } from '../../components/ui/LoadingState'
import type { AnalyticsSummary, SupportTicket } from '../../types'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null)
  const [range, setRange] = useState<DateRangeOption>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    getAnalyticsSummary().then(setAnalytics)
    getTickets().then(setTickets)
  }, [])

  const resolutionTrend = useMemo(
    () => (analytics ? filterTrend(analytics.resolutionTrend, range, customStart, customEnd) : []),
    [analytics, range, customStart, customEnd]
  )
  const escalationTrend = useMemo(
    () => (analytics ? filterTrend(analytics.escalationTrend, range, customStart, customEnd) : []),
    [analytics, range, customStart, customEnd]
  )
  const commonIssues = useMemo(() => deriveCommonIssues(tickets ?? []), [tickets])
  const commonLedPatterns = useMemo(() => deriveCommonLedPatterns(tickets ?? []), [tickets])

  if (!analytics || !tickets) {
    return <LoadingState />
  }

  const repeatContactRate = getRepeatContactRate()

  const stats: Array<[string, string]> = [
    ['Resolution Rate', `${Math.round(analytics.resolutionRate * 100)}%`],
    ['Escalation Rate', `${Math.round(analytics.escalationRate * 100)}%`],
    ['Average Resolution Time', analytics.avgResolutionTime],
    ['First Contact Resolution', `${Math.round(analytics.firstContactResolution * 100)}%`],
    ['Repeat Contact Rate', `${Math.round(repeatContactRate * 100)}%`],
    ['CSAT', analytics.csat === null ? 'No ratings yet' : analytics.csat.toFixed(1)],
  ]

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Analytics</h1>
        <Link to="/admin" className="text-sm font-medium text-primary">
          Back to Dashboard
        </Link>
      </header>

      <div className="mb-2 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="mt-1 text-2xl font-bold text-text">{value}</p>
          </div>
        ))}
      </div>
      <p className="mb-6 text-sm text-text-secondary">
        Repeat Contact Rate is illustrative demo data — detecting a returning customer requires an
        identity, and this app has no login. Every other stat and chart below is computed from real
        scans and tickets.
      </p>

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
        <TrendLineChart
          title="Resolution trend"
          data={resolutionTrend}
          color="#16A34A"
          emptyMessage="No concluded scans yet — this fills in once customers finish troubleshooting."
        />
        <TrendLineChart
          title="Escalation trend"
          data={escalationTrend}
          color="#D97706"
          emptyMessage="No concluded scans yet — this fills in once customers finish troubleshooting."
        />
        <CategoryBarChart
          title="Common router problems"
          data={commonIssues}
          emptyMessage="No escalations yet — common problems will appear here once they happen."
        />
        <CategoryBarChart
          title="Most common LED patterns"
          data={commonLedPatterns}
          emptyMessage="No escalations yet — LED patterns will appear here once they happen."
        />
        <CategoryBarChart
          title="Most successful troubleshooting steps"
          data={analytics.topTroubleshootingSteps}
          emptyMessage="No resolved scans yet — successful steps will appear here once customers finish troubleshooting."
        />
      </div>
    </div>
  )
}
