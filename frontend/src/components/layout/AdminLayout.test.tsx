import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { useAdminTheme } from './AdminThemeContext'

function ThemeToggleProbe() {
  const { dark, toggleDark } = useAdminTheme()
  return (
    <button type="button" onClick={toggleDark}>
      {dark ? 'dark' : 'light'}
    </button>
  )
}

function renderLayout(path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminLayout>
        <p>page content</p>
        <ThemeToggleProbe />
      </AdminLayout>
    </MemoryRouter>
  )
}

describe('AdminLayout', () => {
  beforeEach(() => {
    localStorage.removeItem('admin-theme')
  })

  afterEach(() => {
    localStorage.removeItem('admin-theme')
  })

  it('renders children and a nav link for each admin section', () => {
    renderLayout()

    expect(screen.getByText('page content')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Support Tickets/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Analytics/ })).toBeInTheDocument()
  })

  it('marks only the current route as active, not every admin link', () => {
    renderLayout('/admin/tickets')

    expect(screen.getByRole('link', { name: /Support Tickets/ })).toHaveClass('text-primary')
    expect(screen.getByRole('link', { name: /Dashboard/ })).not.toHaveClass('text-primary')
  })

  it('hides text labels while keeping links reachable when collapsed', () => {
    renderLayout()

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(screen.queryByText('Support Tickets')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Support Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
  })

  it('defaults to light mode and toggles to dark via context, persisting the choice', () => {
    const { container } = renderLayout()
    const root = container.firstChild as HTMLElement
    expect(root).not.toHaveClass('dark')
    expect(screen.getByText('light')).toBeInTheDocument()

    fireEvent.click(screen.getByText('light'))

    expect(root).toHaveClass('dark')
    expect(screen.getByText('dark')).toBeInTheDocument()
    expect(localStorage.getItem('admin-theme')).toBe('dark')
  })

  it('restores a previously saved dark preference on mount', () => {
    localStorage.setItem('admin-theme', 'dark')

    const { container } = renderLayout()

    expect(container.firstChild).toHaveClass('dark')
    expect(screen.getByText('dark')).toBeInTheDocument()
  })
})
