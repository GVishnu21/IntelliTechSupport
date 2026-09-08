import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { AdminHeaderActions } from '../../components/layout/AdminHeaderActions'
import { StarDisplay } from '../../components/ui/StarDisplay'
import { LoadingState } from '../../components/ui/LoadingState'
import { getFeedback } from '../../services/api'
import type { RecentFeedback } from '../../types'

// scans.outcome is a broader vocabulary than TicketStatus (it also includes
// "unrecognized" -- a photo that never became a session at all), so this
// gets its own small badge map rather than forcing it through StatusBadge.
const OUTCOME_BADGE: Record<string, { label: string; className: string }> = {
  resolved: {
    label: 'Resolved',
    className: 'bg-green-50 text-success border-green-200 dark:bg-green-950 dark:border-green-800',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-red-50 text-error border-red-200 dark:bg-red-950 dark:border-red-800',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-50 text-warning border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  },
  unrecognized: {
    label: 'Unrecognized',
    className: 'bg-slate-100 text-text-secondary border-border dark:bg-slate-800',
  },
}

function formatSubmitted(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AdminFeedbackDetails() {
  const { id } = useParams()
  const [entry, setEntry] = useState<RecentFeedback | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getFeedback(id).then((result) => setEntry(result ?? null))
  }, [id])

  if (entry === undefined) {
    return (
      <AdminLayout>
        <LoadingState />
      </AdminLayout>
    )
  }

  if (!entry) {
    return (
      <AdminLayout>
        <div className="p-8">
          <h1 className="text-xl font-bold text-text">Feedback not found</h1>
          <Link to="/admin/feedback" className="text-sm font-medium text-primary">
            Back to Feedback
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const outcome = OUTCOME_BADGE[entry.outcome] ?? OUTCOME_BADGE.unrecognized

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl p-6 md:p-8">
        <Link to="/admin/feedback" className="text-sm font-medium text-primary">
          Back to Feedback
        </Link>

        <header className="mt-2 mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-text">Feedback #{entry.id.slice(0, 8)}</h1>
          <AdminHeaderActions />
        </header>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <StarDisplay rating={entry.rating} size={24} />
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
            <div>
              <p className="text-sm text-text-secondary">Customer</p>
              <p className="text-base font-medium text-text">Anonymous customer</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Equipment</p>
              <p className="text-base font-medium text-text">{entry.equipment}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Submitted</p>
              <p className="text-base font-medium text-text">{formatSubmitted(entry.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Resolution</p>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${outcome.className}`}
              >
                {outcome.label}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-bold text-text">Feedback</h3>
            <p className="text-base text-text">
              {entry.feedback ? `"${entry.feedback}"` : 'No written comment was left.'}
            </p>
          </div>

          {entry.sessionId && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-text-secondary">Related Session</p>
              <p className="break-all text-sm font-medium text-text">{entry.sessionId}</p>
              <p className="mt-2 text-xs text-text-secondary">
                This session was resolved directly by the customer, so it has no associated support ticket.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
