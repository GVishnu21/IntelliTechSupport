import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics, getTickets } from '../../services/api'
import { TrendLineChart } from '../../components/admin/TrendLineChart'
import { CategoryBarChart } from '../../components/admin/CategoryBarChart'
import { LiveBadge } from '../../components/admin/LiveBadge'
import { DateRangeFilter, type DateRangeOption } from '../../components/admin/DateRangeFilter'
import { filterTrend } from '../../utils/trend'
import { deriveCommonIssues, deriveCommonRouterModels, deriveEscalationCountTrend } from '../../utils/ticketStats'
import { LoadingState } from '../../components/ui/LoadingState'
import type { AnalyticsSummary, SupportTicket } from '../../types'

const METRICS: Array<{ key: keyof AnalyticsSummary; label: string; format: (value: AnalyticsSummary) => string }> = [
  { key: 'totalScans', label: 'Total Scans', format: (a) => a.totalScans.toLocaleString() },
  { key: 'resolutionRate', label: 'Resolution Rate', format: (a) => `${Math.round(a.resolutionRate * 100)}%` },
  { key: 'escalationRate', label: 'Escalation Rate', format: (a) => `${Math.round(a.escalationRate * 100)}%` },
  { key: 'avgResolutionTime', label: 'Average Resolution Time', format: (a) => a.avgResolutionTime },
]

export default function AdminDashboard() {
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
  const commonRouterModels = useMemo(() => deriveCommonRouterModels(tickets ?? []), [tickets])
  const escalationTrend = useMemo(() => deriveEscalationCountTrend(tickets ?? []), [tickets])

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Intelli TechSupport</h1>
          <p className="text-text-secondary">Overview</p>
        </div>
        <nav className="flex gap-4 text-sm font-medium text-text-secondary">
          <Link to="/admin" className="text-primary">
            Dashboard
          </Link>
          <Link to="/admin/tickets" className="hover:text-text">
            Support Tickets
          </Link>
          <Link to="/admin/analytics" className="hover:text-text">
            Analytics
          </Link>
        </nav>
      </header>

      {!analytics || !tickets ? (
        <LoadingState />
      ) : (
        <>
          <div className="mb-2 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {METRICS.map((metric) => (
              <div key={metric.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm text-text-secondary">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold text-text">{metric.format(analytics)}</p>
              </div>
            ))}
          </div>
          <p className="mb-6 text-sm text-text-secondary">
            Metrics above are illustrative demo data — full scan tracking (including successful,
            non-escalated sessions) isn't persisted yet. Charts below marked{' '}
            <LiveBadge /> are computed from real escalated tickets.
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
            <TrendLineChart title="Resolution rate over time" data={resolutionTrend} color="#16A34A" />
            <TrendLineChart
              title="Escalation trend"
              badge={<LiveBadge />}
              data={escalationTrend}
              color="#D97706"
              valueFormatter={(value) => `${value} escalation${value === 1 ? '' : 's'}`}
              emptyMessage="No escalations yet — this will fill in as customers escalate."
            />
            <CategoryBarChart
              title="Common issues"
              badge={<LiveBadge />}
              data={commonIssues}
              emptyMessage="No escalations yet — common issues will appear here once they happen."
            />
            <CategoryBarChart
              title="Most escalated router models"
              badge={<LiveBadge />}
              data={commonRouterModels}
              emptyMessage="No escalations yet — router models will appear here once they happen."
            />
          </div>
        </>
      )}
    </div>
  )
}
