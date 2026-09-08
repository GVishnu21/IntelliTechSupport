import type { AppNotification } from '../types'
import { getRecentFeedback, getTickets } from './api'

const LAST_SEEN_STORAGE_KEY = 'admin_notifications_last_seen'
const MAX_NOTIFICATIONS = 20

export function getNotificationsLastSeen(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setNotificationsLastSeen(iso: string): void {
  try {
    localStorage.setItem(LAST_SEEN_STORAGE_KEY, iso)
  } catch {
    // Private browsing / storage blocked -- the badge just won't stay
    // cleared across a refresh, same fallback as everywhere else that
    // touches localStorage in this app.
  }
}

// Reuses the existing /tickets and /feedback/recent endpoints -- no
// duplicate ticket store, no separate notification table. Modular by
// design: a future notification source only needs its own small mapping
// function added here; the bell/dropdown UI only ever sees AppNotification.
export async function fetchNotifications(): Promise<AppNotification[]> {
  const [tickets, feedback] = await Promise.all([getTickets(), getRecentFeedback()])

  const ticketNotifications: AppNotification[] = tickets.map((ticket) => ({
    id: `ticket-${ticket.id}`,
    type: 'ticket',
    title: 'New Ticket',
    description: `Customer reported: "${ticket.issue}"`,
    createdAt: ticket.createdAt,
    href: `/admin/tickets/${ticket.id}`,
  }))

  const feedbackNotifications: AppNotification[] = feedback.map((entry) => ({
    id: `feedback-${entry.id}`,
    type: 'feedback',
    title: 'New Feedback',
    description: `${entry.rating}-star rating received for ${entry.equipment}${
      entry.feedback ? `: "${entry.feedback}"` : '.'
    }`,
    createdAt: entry.createdAt,
    href: `/admin/feedback/${entry.id}`,
  }))

  return [...ticketNotifications, ...feedbackNotifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_NOTIFICATIONS)
}
