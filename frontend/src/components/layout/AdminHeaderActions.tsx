import { useEffect, useRef, useState } from 'react'
import { LogOut, Moon, Sun, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminTheme } from './AdminThemeContext'
import { NotificationBell } from './NotificationBell'
import { clearAdminToken, getAdminEmail } from '../../services/adminAuth'

// Sits inline with each admin page's own title row (not a separate chrome
// bar). Notifications poll real tickets/feedback (see NotificationBell).
// Theme toggle is real. The account button opens a menu rather than signing
// out directly -- "Signed in as" shows the real logged-in email (there's no
// profile/settings/etc. behind this, so the menu is just that plus the one
// real action: Log out).
export function AdminHeaderActions() {
  const { dark, toggleDark } = useAdminTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  function handleSignOut() {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  const email = getAdminEmail()

  return (
    <div className="flex shrink-0 items-center gap-2">
      <NotificationBell />
      <button
        type="button"
        onClick={toggleDark}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-slate-50 hover:text-text dark:hover:bg-slate-800"
      >
        {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-slate-50 hover:text-text dark:hover:bg-slate-800"
        >
          <UserCircle size={18} aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {email && (
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Signed in as</p>
                <p className="truncate text-sm font-medium text-text">{email}</p>
              </div>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-error hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <LogOut size={16} aria-hidden="true" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
