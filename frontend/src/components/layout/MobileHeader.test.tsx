import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MobileHeader } from './MobileHeader'

describe('MobileHeader', () => {
  it('shows the title and hides the back button by default', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Diagnosis" />
      </MemoryRouter>
    )
    expect(screen.getByText('Diagnosis')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument()
  })

  it('shows a back button when showBack is true', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Diagnosis" showBack />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
  })

  it('renders a custom rightAction when provided', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Home" rightAction={<button aria-label="Help">?</button>} />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument()
  })
})
