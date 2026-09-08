import { useEffect, useRef, useState } from 'react'
import { Bell, Star, Ticket as TicketIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications, getNotificationsLastSeen, setNotificationsLastSeen } from '../../services/notifications'
import { formatRelativeTime } from '../../utils/time'
import type { AppNotification, AppNotificationType } from '../../types'

// "Around every 2-5 minutes" per spec -- polling, not push (no WebSockets/SSE).
const POLL_INTERVAL_MS = 3 * 60 * 1000

const TYPE_ICON: Record<AppNotificationType, typeof TicketIcon> = {
  ticket: TicketIcon,
  feedback: Star,
}

function isUnread(notification: AppNotification, lastSeen: string | null): boolean {
  // Compare as actual instants, not strings -- the backend (Postgres via
  // Pydantic) and frontend (Date#toISOString) don't format timestamps
  // identically (+00:00 vs Z, variable fractional-second length), so a raw
  // string ">" isn't reliably ordered right at sub-second boundaries.
  return !lastSeen || new Date(notification.createdAt).getTime() > new Date(lastSeen).getTime()
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [lastSeen, setLastSeen] = useState<string | null>(getNotificationsLastSeen)
  // Snapshot of which ids were unread at the moment the panel opened --
  // keeps their visual "unread" state in the dropdown even after the badge
  // itself clears, so opening the panel doesn't erase the very distinction
  // it's showing.
  const [unreadAtOpen, setUnreadAtOpen] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const result = await fetchNotifications()
        if (!cancelled) setNotifications(result)
      } catch {
        // Best-effort: notification polling failing (offline, backend down)
        // must never break the rest of the admin portal.
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const unreadCount = notifications.filter((n) => isUnread(n, lastSeen)).length

  function handleToggle() {
    setMenuOpen((open) => {
      const opening = !open
      if (opening) {
        setUnreadAtOpen(new Set(notifications.filter((n) => isUnread(n, lastSeen)).map((n) => n.id)))
        const now = new Date().toISOString()
        setNotificationsLastSeen(now)
        setLastSeen(now)
      }
      return opening
    })
  }

  function handleSelect(notification: AppNotification) {
    if (!notification.href) return
    setMenuOpen(false)
    navigate(notification.href)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-slate-50 hover:text-text dark:hover:bg-slate-800"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-xs font-semibold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {unreadCount > 0 && <span className="sr-only">{unreadCount} unread notifications</span>}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-20 max-h-96 w-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg sm:w-96"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-secondary">You&apos;re all caught up</p>
          ) : (
            <ul>
              {notifications.map((notification) => {
                const Icon = TYPE_ICON[notification.type]
                const unread = unreadAtOpen.has(notification.id)
                const rowClassName = `flex w-full items-start gap-3 px-4 py-3 text-left ${
                  unread ? 'bg-primary/5' : ''
                }`

                const content = (
                  <>
                    <Icon size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{notification.description}</p>
                      <p className="mt-1 text-xs text-text-secondary">{formatRelativeTime(notification.createdAt)}</p>
                    </div>
                    {unread && (
                      <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </>
                )

                return (
                  <li key={notification.id} role="none" className="border-b border-border last:border-0">
                    {notification.href ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelect(notification)}
                        className={`${rowClassName} hover:bg-slate-50 dark:hover:bg-slate-800`}
                      >
                        {content}
                      </button>
                    ) : (
                      // Not role="menuitem" -- it isn't actionable, its full
                      // content is already shown inline, so it's just static
                      // content inside the menu rather than a choice in it.
                      <div className={rowClassName}>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
