import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck } from 'lucide-react'
import { getTicket, updateTicketStatus } from '../../services/api'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { AdminHeaderActions } from '../../components/layout/AdminHeaderActions'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LedStatusList } from '../../components/diagnosis/LedStatusList'
import { RouterImage } from '../../components/diagnosis/RouterImage'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import type { SupportTicket } from '../../types'

const OUTCOME_LABEL: Record<'completed' | 'failed' | 'skipped', string> = {
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
}

type BusyAction = 'resolve' | 'escalate' | null

export default function AdminTicketDetails() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<SupportTicket | null | undefined>(undefined)
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getTicket(id).then(setTicket)
  }, [id])

  async function handleUpdateStatus(status: 'resolved' | 'escalated', busy: BusyAction) {
    if (!ticket) return
    setBusyAction(busy)
    setActionError(null)
    try {
      const updated = await updateTicketStatus(ticket.id, status)
      setTicket(updated)
    } catch {
      setActionError("We're having trouble connecting. Check your connection and try again.")
    } finally {
      setBusyAction(null)
    }
  }

  if (ticket === undefined) {
    return (
      <AdminLayout>
        <LoadingState />
      </AdminLayout>
    )
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="p-8">
          <h1 className="text-xl font-bold text-text">Ticket not found</h1>
          <Link to="/admin/tickets" className="text-sm font-medium text-primary">
            Back to Support Tickets
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <Link to="/admin/tickets" className="text-sm font-medium text-primary">
          Back to Support Tickets
        </Link>

        <header className="mt-2 mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-text">Ticket #{ticket.id}</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={ticket.status} />
            <AdminHeaderActions />
          </div>
        </header>

        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <RouterImage alt={ticket.router} />
            <div>
              <p className="text-sm text-text-secondary">Customer</p>
              <p className="text-base font-medium text-text">{ticket.customer}</p>
              {ticket.contactPhone && (
                <>
                  <p className="mt-2 text-sm text-text-secondary">Callback number</p>
                  <p className="flex items-center gap-1.5 text-base font-medium text-text">
                    {ticket.contactPhone}
                    {ticket.contactPhoneVerified && (
                      <span className="flex items-center gap-1 text-sm font-medium text-success">
                        <BadgeCheck size={16} aria-hidden="true" />
                        Verified
                      </span>
                    )}
                  </p>
                </>
              )}
              <p className="mt-2 text-sm text-text-secondary">Router</p>
              <p className="text-base font-medium text-text">{ticket.router}</p>
            </div>
          </div>

          <LedStatusList lights={ticket.ledStatus} />

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-lg font-bold text-text">AI diagnosis</h3>
            <p className="mt-1 text-base text-text">{ticket.aiDiagnosis}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-bold text-text">Troubleshooting history</h3>
            <ol className="space-y-1">
              {ticket.history.map((item, index) => (
                <li key={item.step} className="flex justify-between text-base text-text">
                  <span>
                    {index + 1}. {item.step}
                  </span>
                  <span className="text-text-secondary">{OUTCOME_LABEL[item.outcome]}</span>
                </li>
              ))}
            </ol>
          </div>

          {actionError && <ErrorState title={actionError} inline />}

          <div className="flex flex-wrap gap-3">
            {ticket.contactPhone ? (
              <a
                href={`tel:${ticket.contactPhone}`}
                className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Contact Customer
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="No callback number was provided for this ticket"
                className="flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-text-secondary opacity-50"
              >
                Contact Customer
              </button>
            )}
            <button
              type="button"
              onClick={() => handleUpdateStatus('resolved', 'resolve')}
              disabled={busyAction !== null}
              className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyAction === 'resolve' ? 'Marking resolved…' : 'Mark Resolved'}
            </button>
            <button
              type="button"
              onClick={() => handleUpdateStatus('escalated', 'escalate')}
              disabled={busyAction !== null}
              className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-error hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950"
            >
              {busyAction === 'escalate' ? 'Escalating…' : 'Escalate to Network Team'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
