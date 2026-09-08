import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminHeaderActions } from './AdminHeaderActions'
import { AdminThemeContext } from './AdminThemeContext'
import { getAdminToken } from '../../services/adminAuth'

function renderActions() {
  return render(
    <MemoryRouter>
      <AdminHeaderActions />
    </MemoryRouter>
  )
}

function openAccountMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
}

describe('AdminHeaderActions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders a real, clickable notifications bell', () => {
    renderActions()

    const notifications = screen.getByRole('button', { name: 'Notifications' })

    expect(notifications).not.toBeDisabled()
  })

  it('keeps the account menu closed until the account button is clicked', () => {
    renderActions()

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    openAccountMenu()

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('shows the real signed-in email inside the menu', () => {
    localStorage.setItem('admin_token', 'some-token')
    localStorage.setItem('admin_email', 'admin@example.com')
    renderActions()

    openAccountMenu()

    expect(screen.getByText('Signed in as')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('signs out by clearing the admin token from the menu', () => {
    localStorage.setItem('admin_token', 'some-token')
    localStorage.setItem('admin_email', 'admin@example.com')
    renderActions()

    openAccountMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }))

    expect(getAdminToken()).toBeNull()
  })

  it('closes the menu on Escape', () => {
    renderActions()

    openAccountMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes the menu when clicking outside it', () => {
    renderActions()

    openAccountMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('calls toggleDark and reflects the current theme in the button label', () => {
    const toggleDark = vi.fn()
    render(
      <MemoryRouter>
        <AdminThemeContext.Provider value={{ dark: false, toggleDark }}>
          <AdminHeaderActions />
        </AdminThemeContext.Provider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(toggleDark).toHaveBeenCalledOnce()
  })

  it('shows the light-mode label once dark is active', () => {
    render(
      <MemoryRouter>
        <AdminThemeContext.Provider value={{ dark: true, toggleDark: vi.fn() }}>
          <AdminHeaderActions />
        </AdminThemeContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })
})
