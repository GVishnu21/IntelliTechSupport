import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTickets } from '../../services/api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import type { SupportTicket, TicketStatus } from '../../types'

const STATUS_OPTIONS: Array<{ value: TicketStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
]

const SELECT_CLASS =
  'min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}

export default function AdminTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [issueFilter, setIssueFilter] = useState<string>('all')

  useEffect(() => {
    getTickets().then(setTickets)
  }, [])

  const issueOptions = useMemo(() => Array.from(new Set(tickets.map((t) => t.issue))), [tickets])

  const filtered = tickets.filter((ticket) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false
    if (issueFilter !== 'all' && ticket.issue !== issueFilter) return false
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      ticket.id.toLowerCase().includes(term) ||
      ticket.customer.toLowerCase().includes(term) ||
      ticket.issue.toLowerCase().includes(term) ||
      ticket.router.toLowerCase().includes(term)
    )
  })

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Support Tickets</h1>
        <Link to="/admin" className="text-sm font-medium text-primary">
          Back to Dashboard
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tickets…"
          className="min-h-11 w-full max-w-sm rounded-lg border border-border bg-card px-3 text-sm text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />

        <label className="sr-only" htmlFor="ticket-status-filter">
          Filter by status
        </label>
        <select
          id="ticket-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TicketStatus | 'all')}
          className={SELECT_CLASS}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="ticket-issue-filter">
          Filter by issue
        </label>
        <select
          id="ticket-issue-filter"
          value={issueFilter}
          onChange={(event) => setIssueFilter(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="all">All issues</option>
          {issueOptions.map((issue) => (
            <option key={issue} value={issue}>
              {issue}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Router</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/admin/tickets/${ticket.id}`)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ticket ${ticket.id} for ${ticket.customer}`}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <td className="px-4 py-3 font-medium text-text">{ticket.id}</td>
                <td className="px-4 py-3 text-text">{ticket.customer}</td>
                <td className="px-4 py-3 text-text">{ticket.issue}</td>
                <td className="px-4 py-3 text-text">{ticket.router}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatRelativeTime(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="No tickets match your filters." />}
      </div>
    </div>
  )
}
