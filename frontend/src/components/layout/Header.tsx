import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, UserCircle } from 'lucide-react'
import { clearCustomerSession, getCustomerProfile } from '../../services/customerAuth'

export function Header() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const profile = getCustomerProfile()

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

  function handleLogOut() {
    clearCustomerSession()
    navigate('/login', { replace: true })
  }

  return (
    <header className="hidden border-b border-border bg-card px-8 py-4 md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <NavLink to="/" className="text-lg font-bold text-text">
          Intelli TechSupport
        </NavLink>
        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-base font-medium ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text'}`
            }
          >
            Home
          </NavLink>
          <span className="text-base font-medium text-text-secondary/50" aria-disabled="true">
            My Issues
          </span>
          <NavLink
            to="/faq"
            className={({ isActive }) =>
              `text-base font-medium ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text'}`
            }
          >
            Help
          </NavLink>
        </nav>

        {/* Only a signed-up customer has an account to show -- Home is now
            reachable before sign-up (the popup handles that), so this menu
            only renders once a real profile exists rather than showing a
            Log out option with nothing behind it. The empty slot below
            keeps the logo/nav/account layout balanced either way. */}
        {profile ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-50"
            >
              <UserCircle size={24} className="text-text-secondary" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Signed in as</p>
                  <p className="truncate text-sm font-medium text-text">{profile.name}</p>
                  <p className="truncate text-sm text-text-secondary">{profile.phone}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogOut}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-error hover:bg-slate-50"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-11 min-w-11" aria-hidden="true" />
        )}
      </div>
    </header>
  )
}
