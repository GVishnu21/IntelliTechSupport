import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminHeaderActions } from './AdminHeaderActions'
import { AdminThemeContext } from './AdminThemeContext'

describe('AdminHeaderActions', () => {
  it('disables notifications and profile with an explanation', () => {
    render(<AdminHeaderActions />)

    const notifications = screen.getByRole('button', { name: 'Notifications' })
    const profile = screen.getByRole('button', { name: 'Profile' })

    expect(notifications).toBeDisabled()
    expect(notifications).toHaveAttribute('title', 'No notification system exists yet')
    expect(profile).toBeDisabled()
    expect(profile).toHaveAttribute('title', "Sign-in isn't available yet")
  })

  it('calls toggleDark and reflects the current theme in the button label', () => {
    const toggleDark = vi.fn()
    render(
      <AdminThemeContext.Provider value={{ dark: false, toggleDark }}>
        <AdminHeaderActions />
      </AdminThemeContext.Provider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(toggleDark).toHaveBeenCalledOnce()
  })

  it('shows the light-mode label once dark is active', () => {
    render(
      <AdminThemeContext.Provider value={{ dark: true, toggleDark: vi.fn() }}>
        <AdminHeaderActions />
      </AdminThemeContext.Provider>
    )

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })
})
