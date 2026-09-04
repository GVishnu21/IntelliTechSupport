import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title and optional description', () => {
    render(<EmptyState title="No tickets match your search." description="Try a different term." />)
    expect(screen.getByText('No tickets match your search.')).toBeInTheDocument()
    expect(screen.getByText('Try a different term.')).toBeInTheDocument()
  })

  it('renders without a description', () => {
    render(<EmptyState title="No results" />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})
