import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTickets } from '../../services/api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { SupportTicket } from '../../types'

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

  useEffect(() => {
    getTickets().then(setTickets)
  }, [])

  const filtered = tickets.filter((ticket) => {
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

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search tickets…"
        className="mb-4 w-full max-w-sm rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />

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
                className="cursor-pointer border-b border-border last:border-0 hover:bg-slate-50"
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
        {filtered.length === 0 && (
          <p className="p-6 text-center text-text-secondary">No tickets match your search.</p>
        )}
      </div>
    </div>
  )
}
