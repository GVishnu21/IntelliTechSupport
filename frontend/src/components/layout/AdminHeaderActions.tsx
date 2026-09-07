import { Bell, Moon, Sun, UserCircle } from 'lucide-react'
import { useAdminTheme } from './AdminThemeContext'

// Sits inline with each admin page's own title row (not a separate chrome
// bar) -- notifications and profile are honestly disabled since neither a
// notification system nor sign-in exists yet; the theme toggle is real.
export function AdminHeaderActions() {
  const { dark, toggleDark } = useAdminTheme()

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        disabled
        aria-label="Notifications"
        title="No notification system exists yet"
        className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-border text-text-secondary opacity-50"
      >
        <Bell size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={toggleDark}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-slate-50 hover:text-text dark:hover:bg-slate-800"
      >
        {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>
      <button
        type="button"
        disabled
        aria-label="Profile"
        title="Sign-in isn't available yet"
        className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-border text-text-secondary opacity-50"
      >
        <UserCircle size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
