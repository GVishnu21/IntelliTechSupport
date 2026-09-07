import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Ticket as TicketIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { getAnalyticsSummary, getTickets } from '../../services/api'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { AdminHeaderActions } from '../../components/layout/AdminHeaderActions'
import { TrendLineChart } from '../../components/admin/TrendLineChart'
import { CategoryBarChart } from '../../components/admin/CategoryBarChart'
import { DateRangeFilter, type DateRangeOption } from '../../components/admin/DateRangeFilter'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { computeTrendChange, filterTrend } from '../../utils/trend'
import { formatRelativeTime } from '../../utils/time'
import { deriveCommonIssues, deriveCommonRouterModels } from '../../utils/ticketStats'
import { LoadingState } from '../../components/ui/LoadingState'
import type { AnalyticsSummary, SupportTicket, TicketStatus } from '../../types'

const METRIC_CARDS: Array<{
  key: keyof AnalyticsSummary
  label: string
  icon: typeof Activity
  chipClassName: string
  format: (value: AnalyticsSummary) => string
  // Whether an upward trend is the good direction for this metric -- an
  // uptick in Resolution Rate is good news, an uptick in Escalation Rate
  // isn't. Only set for cards with a real trend series to compare against.
  upIsGood?: boolean
}> = [
  {
    key: 'totalScans',
    label: 'Total Scans',
    icon: Activity,
    chipClassName: 'bg-primary/10 text-primary',
    format: (a) => a.totalScans.toLocaleString(),
  },
  {
    key: 'resolutionRate',
    label: 'Resolution Rate',
    icon: CheckCircle2,
    chipClassName: 'bg-green-50 text-success dark:bg-green-950',
    format: (a) => `${Math.round(a.resolutionRate * 100)}%`,
    upIsGood: true,
  },
  {
    key: 'escalationRate',
    label: 'Escalation Rate',
    icon: AlertTriangle,
    chipClassName: 'bg-amber-50 text-warning dark:bg-amber-950',
    format: (a) => `${Math.round(a.escalationRate * 100)}%`,
    upIsGood: false,
  },
  {
    key: 'avgResolutionTime',
    label: 'Average Resolution Time',
    icon: Clock,
    chipClassName: 'bg-primary/10 text-primary',
    format: (a) => a.avgResolutionTime,
  },
]

const RANGE_LABEL: Record<DateRangeOption, string> = {
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days',
  custom: 'selected range',
}

const TICKET_ICON_CHIP: Record<TicketStatus, string> = {
  open: 'bg-primary/10 text-primary',
  in_progress: 'bg-amber-50 text-warning dark:bg-amber-950',
  resolved: 'bg-green-50 text-success dark:bg-green-950',
  escalated: 'bg-red-50 text-error dark:bg-red-950',
}

function QuickStatBar({ label, value, colorClassName }: { label: string; value: number; colorClassName: string }) {
  const pct = Math.round(value * 100)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-medium text-text">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-2 rounded-full ${colorClassName}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
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
  const commonRouterModels = useMemo(() => deriveCommonRouterModels(tickets ?? []), [tickets])
  const recentTickets = useMemo(() => (tickets ?? []).slice(0, 5), [tickets])

  // Computed from the same (date-range-filtered) series the trend charts
  // below plot, so the card's delta always matches what's currently shown.
  const metricChanges: Partial<Record<keyof AnalyticsSummary, ReturnType<typeof computeTrendChange>>> = {
    resolutionRate: computeTrendChange(resolutionTrend),
    escalationRate: computeTrendChange(escalationTrend),
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
            <p className="text-text-secondary">Overview</p>
          </div>
          <AdminHeaderActions />
        </header>

        {!analytics || !tickets ? (
          <LoadingState />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {METRIC_CARDS.map((metric) => {
                const change = metricChanges[metric.key]
                const isGoodDirection = change && metric.upIsGood !== undefined && (change.direction === 'up') === metric.upIsGood
                return (
                  <div key={metric.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`inline-flex rounded-lg p-2 ${metric.chipClassName}`}>
                        <metric.icon size={18} aria-hidden="true" />
                      </div>
                      {change && change.direction !== 'flat' && (
                        <span
                          className={isGoodDirection ? 'text-success' : 'text-error'}
                          aria-label={change.direction === 'up' ? 'Trending up' : 'Trending down'}
                        >
                          {change.direction === 'up' ? (
                            <TrendingUp size={16} aria-hidden="true" />
                          ) : (
                            <TrendingDown size={16} aria-hidden="true" />
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold text-text">{metric.format(analytics)}</p>
                    {change && change.direction !== 'flat' && (
                      <p className={`mt-1 text-sm ${isGoodDirection ? 'text-success' : 'text-error'}`}>
                        {change.deltaPercentagePoints > 0 ? '+' : ''}
                        {change.deltaPercentagePoints}pp over {RANGE_LABEL[range]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-text">Recent Tickets</h3>
                  <Link
                    to="/admin/tickets"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    View all
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
                {recentTickets.length === 0 ? (
                  <EmptyState title="No tickets yet — they'll show up here once a customer escalates." />
                ) : (
                  <ul className="space-y-1">
                    {recentTickets.map((ticket) => (
                      <li key={ticket.id}>
                        <Link
                          to={`/admin/tickets/${ticket.id}`}
                          className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <div className={`shrink-0 rounded-lg p-2 ${TICKET_ICON_CHIP[ticket.status]}`}>
                            <TicketIcon size={16} aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text">{ticket.issue}</p>
                            <p className="truncate text-xs text-text-secondary">{ticket.router}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <StatusBadge status={ticket.status} />
                            <span className="text-xs text-text-secondary">{formatRelativeTime(ticket.createdAt)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-text">Quick Stats</h3>
                <div className="space-y-4">
                  <QuickStatBar label="Resolution Rate" value={analytics.resolutionRate} colorClassName="bg-success" />
                  <QuickStatBar label="Escalation Rate" value={analytics.escalationRate} colorClassName="bg-warning" />
                  <QuickStatBar
                    label="First Contact Resolution"
                    value={analytics.firstContactResolution}
                    colorClassName="bg-primary"
                  />
                </div>
              </div>
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
              <TrendLineChart
                title="Resolution rate over time"
                data={resolutionTrend}
                color="#16A34A"
                darkColor="#22C55E"
                emptyMessage="No concluded scans yet — this fills in once customers finish troubleshooting."
              />
              <TrendLineChart
                title="Escalation trend"
                data={escalationTrend}
                color="#D97706"
                darkColor="#F59E0B"
                emptyMessage="No concluded scans yet — this fills in once customers finish troubleshooting."
              />
              <CategoryBarChart
                title="Common issues"
                data={commonIssues}
                emptyMessage="No escalations yet — common issues will appear here once they happen."
              />
              <CategoryBarChart
                title="Most escalated router models"
                data={commonRouterModels}
                emptyMessage="No escalations yet — router models will appear here once they happen."
              />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
