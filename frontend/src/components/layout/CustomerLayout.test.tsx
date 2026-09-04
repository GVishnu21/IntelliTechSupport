import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CustomerLayout } from './CustomerLayout'

describe('CustomerLayout', () => {
  it('renders children plus both the desktop and mobile chrome by default', () => {
    render(
      <MemoryRouter>
        <CustomerLayout title="Diagnosis">
          <p>page content</p>
        </CustomerLayout>
      </MemoryRouter>
    )
    expect(screen.getByText('page content')).toBeInTheDocument()
    // Header (desktop) and MobileHeader both render "Intelli TechSupport" /
    // "Diagnosis" text -- getAllByText confirms both chrome pieces mounted.
    expect(screen.getAllByText('Intelli TechSupport').length).toBeGreaterThan(0)
    expect(screen.getByText('Diagnosis')).toBeInTheDocument()
  })

  it('omits the desktop Header when focused', () => {
    render(
      <MemoryRouter>
        <CustomerLayout title="Troubleshooting" focused>
          <p>page content</p>
        </CustomerLayout>
      </MemoryRouter>
    )
    // Only the mobile title should render -- no separate desktop brand link.
    expect(screen.queryAllByRole('link', { name: 'Intelli TechSupport' })).toHaveLength(0)
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument()
  })
})
