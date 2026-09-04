import type { TicketStatus } from '../../types'

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-50 text-primary border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-warning border-amber-200' },
  resolved: { label: 'Resolved', className: 'bg-green-50 text-success border-green-200' },
  escalated: { label: 'Escalated', className: 'bg-red-50 text-error border-red-200' },
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
