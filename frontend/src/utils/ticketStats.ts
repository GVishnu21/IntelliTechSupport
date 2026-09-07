import type { LabeledCount, LedReading, SupportTicket, TrendPoint } from '../types'

function countBy(tickets: SupportTicket[], keyFn: (ticket: SupportTicket) => string): LabeledCount[] {
  const counts = new Map<string, number>()
  for (const ticket of tickets) {
    const key = keyFn(ticket)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

export function deriveCommonIssues(tickets: SupportTicket[]): LabeledCount[] {
  return countBy(tickets, (ticket) => ticket.issue)
}

export function deriveCommonRouterModels(tickets: SupportTicket[]): LabeledCount[] {
  return countBy(tickets, (ticket) => ticket.router)
}

function describeFaultPattern(lights: LedReading[]): string {
  const fault = lights.find((light) => light.color === 'red' || light.color === 'amber')
  if (!fault) return 'No fault light detected'
  const stateLabel = fault.state === 'blinking' ? 'Blinking' : fault.state === 'off' ? 'Off' : 'Solid'
  const colorLabel = fault.color.charAt(0).toUpperCase() + fault.color.slice(1)
  return `${fault.name} — ${stateLabel} ${colorLabel}`
}

export function deriveCommonLedPatterns(tickets: SupportTicket[]): LabeledCount[] {
  return countBy(tickets, (ticket) => describeFaultPattern(ticket.ledStatus))
}

// Escalations per day, not a rate -- there's no total-scans denominator to
// divide by since successful (non-escalated) sessions aren't persisted
// anywhere. Sparse: only dates with at least one real ticket appear.
export function deriveEscalationCountTrend(tickets: SupportTicket[]): TrendPoint[] {
  const counts = new Map<string, number>()
  for (const ticket of tickets) {
    const date = ticket.createdAt.slice(0, 10)
    counts.set(date, (counts.get(date) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
