import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, ChevronsLeft, ChevronsRight, LayoutDashboard, Router as RouterIcon, Ticket } from 'lucide-react'
import { AdminThemeContext } from './AdminThemeContext'

interface AdminLayoutProps {
  children: ReactNode
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/tickets', label: 'Support Tickets', icon: Ticket, end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, end: true },
]

const THEME_STORAGE_KEY = 'admin-theme'

function loadStoredTheme(): boolean {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
  } catch {
    // Private browsing / storage blocked -- fall back to light.
    return false
  }
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [open, setOpen] = useState(true)
  const [dark, setDark] = useState(loadStoredTheme)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light')
    } catch {
      // Ignore -- theme just won't persist across reloads.
    }
  }, [dark])

  return (
    <AdminThemeContext.Provider value={{ dark, toggleDark: () => setDark((value) => !value) }}>
      <div className={`flex min-h-dvh bg-background ${dark ? 'dark' : ''}`}>
        <nav
          className={`sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${
            open ? 'w-64' : 'w-16'
          }`}
        >
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <RouterIcon size={20} className="text-white" aria-hidden="true" />
            </div>
            {open && <span className="truncate text-sm font-semibold text-text">Intelli TechSupport</span>}
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-primary bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-slate-50 hover:text-text dark:hover:bg-slate-800'
                  }`
                }
                title={open ? undefined : item.label}
              >
                <item.icon size={18} className="shrink-0" aria-hidden="true" />
                {open && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            className="flex h-11 shrink-0 items-center gap-3 border-t border-border px-3 text-sm font-medium text-text-secondary hover:bg-slate-50 hover:text-text dark:hover:bg-slate-800"
          >
            {open ? (
              <ChevronsLeft size={18} className="shrink-0" aria-hidden="true" />
            ) : (
              <ChevronsRight size={18} className="shrink-0" aria-hidden="true" />
            )}
            {open && <span>Collapse</span>}
          </button>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </AdminThemeContext.Provider>
  )
}
