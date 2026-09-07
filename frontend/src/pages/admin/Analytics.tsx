import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics, getTickets } from '../../services/api'
import { TrendLineChart } from '../../components/admin/TrendLineChart'
import { CategoryBarChart } from '../../components/admin/CategoryBarChart'
import { LiveBadge } from '../../components/admin/LiveBadge'
import { DateRangeFilter, type DateRangeOption } from '../../components/admin/DateRangeFilter'
import { filterTrend } from '../../utils/trend'
import { deriveCommonIssues, deriveCommonLedPatterns, deriveEscalationCountTrend } from '../../utils/ticketStats'
import { LoadingState } from '../../components/ui/LoadingState'
import type { AnalyticsSummary, SupportTicket } from '../../types'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null)
  const [range, setRange] = useState<DateRangeOption>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    getAnalytics().then(setAnalytics)
    getTickets().then(setTickets)
  }, [])

  const resolutionTrend = useMemo(
    () => (analytics ? filterTrend(analytics.resolutionTrend, range, customStart, customEnd) : []),
    [analytics, range, customStart, customEnd]
  )
  const commonIssues = useMemo(() => deriveCommonIssues(tickets ?? []), [tickets])
  const commonLedPatterns = useMemo(() => deriveCommonLedPatterns(tickets ?? []), [tickets])
  const escalationTrend = useMemo(() => deriveEscalationCountTrend(tickets ?? []), [tickets])

  if (!analytics || !tickets) {
    return <LoadingState />
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

      <div className="mb-2 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="mt-1 text-2xl font-bold text-text">{value}</p>
          </div>
        ))}
      </div>
      <p className="mb-6 text-sm text-text-secondary">
        Stats above are illustrative demo data — full scan tracking (including successful,
        non-escalated sessions) isn't persisted yet. Charts below marked <LiveBadge /> are computed
        from real escalated tickets.
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
        <TrendLineChart title="Resolution trend" data={resolutionTrend} color="#16A34A" />
        <TrendLineChart
          title="Escalation trend"
          badge={<LiveBadge />}
          data={escalationTrend}
          color="#D97706"
          valueFormatter={(value) => `${value} escalation${value === 1 ? '' : 's'}`}
          emptyMessage="No escalations yet — this will fill in as customers escalate."
        />
        <CategoryBarChart
          title="Common router problems"
          badge={<LiveBadge />}
          data={commonIssues}
          emptyMessage="No escalations yet — common problems will appear here once they happen."
        />
        <CategoryBarChart
          title="Most common LED patterns"
          badge={<LiveBadge />}
          data={commonLedPatterns}
          emptyMessage="No escalations yet — LED patterns will appear here once they happen."
        />
        <CategoryBarChart title="Most successful troubleshooting steps" data={analytics.topTroubleshootingSteps} />
      </div>
    </div>
  )
}
