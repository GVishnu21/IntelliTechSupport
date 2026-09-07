import { NavLink } from 'react-router-dom'
import { UserCircle } from 'lucide-react'

export function Header() {
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
        <button
          type="button"
          aria-label="Profile"
          disabled
          title="Sign-in isn't available yet"
          className="flex min-h-11 min-w-11 items-center justify-center opacity-50 disabled:cursor-not-allowed"
        >
          <UserCircle size={24} className="text-text-secondary" />
        </button>
      </div>
    </header>
  )
}
